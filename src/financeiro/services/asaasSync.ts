import { StorageService } from './storage';
import type { Cliente, ContaBancaria, ExtratoTransacao, Lancamento } from '../types';
import { normalizarTextoLegivel } from '../../utils/textoLegivel';

export async function syncAsaasToFinance(): Promise<{ clientes: number; lancamentos: number; transacoesExtrato: number }> {
  const response = await fetch('/api/integrations/asaas/sync', { method: 'POST' });
  const data = await response.json();
  if (!response.ok) throw new Error(normalizarTextoLegivel(data.error) || 'Não foi possível sincronizar os dados.');

  const today = new Date().toISOString().slice(0, 10);
  const conta: ContaBancaria = {
    id: 'asaas-saldo-demonstracao', nome: 'Saldo demonstrativo', banco: 'Demonstração', tipo: 'gateway',
    saldoInicial: Math.round(Number(data.balance || 0) * 100), dataSaldoInicial: today, ativa: true, corHex: '#0042FF',
  };
  const clientes: Cliente[] = (data.customers || []).map((customer: any) => ({
    id: customer.id,
    nomeRazaoSocial: normalizarTextoLegivel(customer.name) || 'Cliente sem nome',
    nomeFantasia: normalizarTextoLegivel(customer.company) || undefined,
    cnpjCpf: customer.cpfCnpj || '',
    contato: customer.email || customer.mobilePhone || customer.phone || '',
    email: customer.email || undefined,
    telefone: customer.mobilePhone || customer.phone || '',
    planoServico: 'Asaas', valorMensal: 0, diaVencimento: 1,
    dataInicio: customer.dateCreated || today,
    status: customer.deleted ? 'cancelado' : 'ativo',
  }));
  const receitas: Lancamento[] = (data.payments || []).map((payment: any) => {
    const paymentStatus = String(payment.status || 'PENDING');
    const recebido = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(paymentStatus);
    const cancelado = ['DELETED', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(paymentStatus);
    const vencido = paymentStatus === 'OVERDUE';
    const billingType = String(payment.billingType || '').toLowerCase();
    const formaPagamento = billingType === 'credit_card' ? 'cartao' : billingType === 'boleto' ? 'boleto' : billingType === 'pix' ? 'pix' : 'outros';
    const dataVencimento = payment.dueDate || payment.dateCreated || today;
    const valorCents = Math.round(Number(payment.value || 0) * 100);
    return {
      id: `asaas-${payment.id}`, tipo: 'receita',
      descricao: normalizarTextoLegivel(payment.description) || `Cobrança Asaas ${payment.invoiceNumber || payment.id}`,
      categoriaId: 'asaas-pendente-classificacao', subcategoria: 'A classificar no extrato', grupo: 'A classificar',
      clienteId: payment.customer || undefined, contaBancariaId: conta.id,
      mesCompetencia: dataVencimento.slice(0, 7), dataVencimento,
      dataPagamento: recebido ? (payment.paymentDate || payment.clientPaymentDate || dataVencimento) : undefined,
      valorOrcado: valorCents, valorRealizado: recebido ? valorCents : undefined,
      formaPagamento, status: cancelado ? 'cancelado' : recebido ? 'realizado' : vencido ? 'vencido' : 'previsto',
      conciliado: false, tags: ['asaas-importado', 'pendente-classificacao', paymentStatus],
    } as Lancamento;
  });

  // O extrato do Asaas é a fonte de verdade para entradas e saídas já efetivadas.
  const extratoTransacoes: ExtratoTransacao[] = (data.financialTransactions || [])
    .filter((transacao: any) => Number.isFinite(Number(transacao.value)) && transacao.date)
    .map((transacao: any) => ({
      id: `asaas-extrato-${transacao.id}`,
      contaBancariaId: conta.id,
      data: transacao.date,
      descricao: normalizarTextoLegivel(transacao.description) || normalizarTextoLegivel(transacao.type) || 'Movimentação Asaas',
      valorCents: Math.round(Number(transacao.value) * 100),
      // O extrato entra como pendência: a classificação (descrição + categoria) é obrigatória na conciliação.
      conciliado: false,
      lancamentoIdVinculado: Number(transacao.value) < 0
        ? `asaas-despesa-${transacao.id}`
        : transacao.paymentId ? `asaas-${transacao.paymentId}` : undefined,
    }));

  const despesas: Lancamento[] = (data.financialTransactions || [])
    .filter((transacao: any) => Number(transacao.value) < 0 && transacao.date)
    .map((transacao: any) => {
      const valorCents = Math.round(Math.abs(Number(transacao.value)) * 100);
      const dataMovimento = transacao.date;
      return {
        id: `asaas-despesa-${transacao.id}`,
        tipo: 'despesa',
        descricao: normalizarTextoLegivel(transacao.description) || normalizarTextoLegivel(transacao.type) || 'Débito no extrato Asaas',
        categoriaId: 'asaas-pendente-classificacao',
        subcategoria: 'A classificar no extrato',
        grupo: 'A classificar',
        contaBancariaId: conta.id,
        mesCompetencia: dataMovimento.slice(0, 7),
        dataVencimento: dataMovimento,
        dataPagamento: dataMovimento,
        valorOrcado: valorCents,
        valorRealizado: valorCents,
        formaPagamento: 'outros',
        status: 'realizado',
        conciliado: false,
        observacoes: `Movimento ${transacao.type || 'financeiro'} sincronizado do extrato Asaas.`,
        tags: ['asaas-importado', 'pendente-classificacao', 'extrato', 'despesa', String(transacao.type || 'DEBITO')],
      } as Lancamento;
    });
  // O extrato é a única fonte de lançamentos importados. Ele entra pendente,
  // sem categoria, e só gera uma classificação quando o usuário concluir a
  // conciliação. Isso evita receitas/despesas automáticas e duplicadas.
  const lancamentos = [...receitas, ...despesas];
  StorageService.replaceAsaasSnapshot({ conta, clientes, lancamentos, extratoTransacoes });
  return { clientes: clientes.length, lancamentos: lancamentos.length, transacoesExtrato: extratoTransacoes.length };
}
