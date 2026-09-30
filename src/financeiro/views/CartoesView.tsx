import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, FileText, Info, LoaderCircle, ReceiptText, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { extrairItensFaturaPdf, ItemFaturaPdf } from '../services/faturaPdf';
import { Categoria, Lancamento } from '../types';
import { formatarDataBR, formatarMoeda, getDataHojeISO } from '../utils/formatters';

const statusLabel: Record<string, string> = {
  realizado: 'Recebida', previsto: 'Pendente', vencido: 'Vencida', cancelado: 'Cancelada', parcial: 'Parcial',
};

const statusClass: Record<string, string> = {
  realizado: 'bg-sucesso-suave text-sucesso dark:bg-superficie-dark/50 dark:text-texto-forte-dark',
  previsto: 'bg-alerta-suave text-alerta dark:bg-superficie-dark/50 dark:text-texto-forte-dark',
  vencido: 'bg-perigo-suave text-perigo dark:bg-superficie-dark/50 dark:text-texto-forte-dark',
  cancelado: 'bg-fundo-sutil text-texto-medio dark:bg-superficie-dark dark:text-texto-medio-dark',
  parcial: 'bg-primaria-suave text-primaria dark:bg-navy-claro/50 dark:text-primaria-clara',
};

/** A API Asaas expõe cobranças por cartão, não cartões corporativos ou limites. */
export const CartoesView: React.FC = () => {
  const {
    lancamentos, clientes, contas, categorias, isLancamentoNoPeriodo,
    salvarCategoria, salvarLancamentosEmLote, showToast,
  } = useApp();
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [arquivoFatura, setArquivoFatura] = useState<File | null>(null);
  const [itensFatura, setItensFatura] = useState<ItemFaturaPdf[]>([]);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [erroPdf, setErroPdf] = useState('');

  const cobrancasCartao = useMemo(
    () => lancamentos
      .filter((l) => l.tipo === 'receita' && l.formaPagamento === 'cartao' && l.tags.includes('asaas') && isLancamentoNoPeriodo(l))
      .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)),
    [lancamentos, isLancamentoNoPeriodo],
  );
  const clientesPorId = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente.nomeRazaoSocial])),
    [clientes],
  );
  const despesasFatura = useMemo(
    () => lancamentos
      .filter((l) => l.tipo === 'despesa' && l.tags.includes('importacao-fatura-cartao') && isLancamentoNoPeriodo(l))
      .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)),
    [lancamentos, isLancamentoNoPeriodo],
  );
  const metricas = useMemo(() => {
    const recebidas = cobrancasCartao.filter((c) => c.status === 'realizado');
    const pendentes = cobrancasCartao.filter((c) => !['realizado', 'cancelado'].includes(c.status));
    return {
      total: cobrancasCartao.reduce((total, c) => total + c.valorOrcado, 0),
      recebido: recebidas.reduce((total, c) => total + (c.valorRealizado ?? c.valorOrcado), 0),
      pendente: pendentes.reduce((total, c) => total + c.valorOrcado, 0),
      quantidade: cobrancasCartao.length,
    };
  }, [cobrancasCartao]);

  const fecharImportacao = () => {
    setModalImportacaoAberto(false);
    setArquivoFatura(null);
    setItensFatura([]);
    setErroPdf('');
  };

  const selecionarPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;
    if (arquivo.type !== 'application/pdf' && !arquivo.name.toLowerCase().endsWith('.pdf')) {
      setErroPdf('Selecione um arquivo PDF de fatura.');
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      setErroPdf('A fatura deve ter no máximo 10 MB.');
      return;
    }
    setProcessandoPdf(true);
    setErroPdf('');
    try {
      const itens = await extrairItensFaturaPdf(arquivo, new Date().getFullYear());
      setArquivoFatura(arquivo);
      setItensFatura(itens);
      if (itens.length === 0) {
        setErroPdf('Não encontramos itens no PDF. Use uma fatura com texto selecionável; PDFs digitalizados precisam ser lançados manualmente.');
      }
    } catch {
      setErroPdf('Não foi possível ler este PDF. Confirme se o arquivo não está protegido por senha e possui texto selecionável.');
    } finally {
      setProcessandoPdf(false);
    }
  };

  const importarFatura = () => {
    const itensSelecionados = itensFatura.filter((item) => item.selecionado);
    const contaAsaas = contas.find((conta) => conta.id === 'asaas-saldo-producao') || contas[0];
    if (!arquivoFatura || itensSelecionados.length === 0) return;
    if (!contaAsaas) {
      showToast('Sincronize o Asaas antes de importar a fatura para definir a conta financeira.', 'erro');
      return;
    }
    const tagArquivo = `fatura-pdf:${arquivoFatura.name}`;
    if (lancamentos.some((lancamento) => lancamento.tags.includes(tagArquivo))) {
      setErroPdf('Este arquivo já foi importado. Altere o nome do PDF apenas se for realmente uma nova fatura.');
      return;
    }
    const categoriaId = 'fatura-cartao-importada';
    if (!categorias.some((categoria) => categoria.id === categoriaId)) {
      const categoria: Categoria = {
        id: categoriaId,
        grupo: 'Despesas financeiras',
        subcategoria: 'Fatura de cartão importada',
        nome: 'Fatura de cartão importada',
        tipo: 'despesa',
      };
      salvarCategoria(categoria);
    }
    const hoje = getDataHojeISO();
    const novosLancamentos: Lancamento[] = itensSelecionados.map((item, index) => ({
      id: `fatura_pdf_${Date.now()}_${index}`,
      tipo: 'despesa',
      descricao: item.descricao,
      categoriaId,
      subcategoria: 'Fatura de cartão importada',
      grupo: 'Despesas financeiras',
      contaBancariaId: contaAsaas.id,
      mesCompetencia: item.data.slice(0, 7),
      dataVencimento: item.data,
      valorOrcado: item.valorCents,
      formaPagamento: 'cartao',
      status: 'previsto',
      conciliado: false,
      tags: ['importacao-fatura-cartao', tagArquivo],
      observacoes: `Importado da fatura em PDF "${arquivoFatura.name}" em ${hoje}. Revise e marque como pago quando aplicável.`,
    }));
    salvarLancamentosEmLote(novosLancamentos);
    showToast(`${novosLancamentos.length} itens da fatura importados para revisão.`);
    fecharImportacao();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">Cartão de Crédito</h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Cobranças de clientes pelo Asaas e despesas importadas da fatura do cartão.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalImportacaoAberto(true)}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-controle)] bg-primaria px-3.5 py-2 text-xs font-semibold text-white shadow-sutil transition-colors hover:bg-primaria-hover"
        >
          <Upload className="h-4 w-4" /> Importar fatura (PDF)
        </button>
      </div>

      <div className="flex gap-3 rounded-[var(--radius-card)] border border-primaria bg-primaria-suave p-3 text-xs text-primaria dark:border-borda-dark/60 dark:bg-navy-claro/30 dark:text-primaria-clara">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          A API do Asaas não fornece cartões corporativos da empresa, limites, faturas bancárias ou dados completos do cartão.
          Esta tela mostra somente cobranças Asaas sincronizadas por cartão, sem armazenar dados sensíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cobrado no período" value={formatarMoeda(metricas.total)} icon={CreditCard} />
        <MetricCard label="Recebido" value={formatarMoeda(metricas.recebido)} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Pendente / vencido" value={formatarMoeda(metricas.pendente)} icon={Clock3} tone="amber" />
        <MetricCard label="Cobranças por cartão" value={String(metricas.quantidade)} icon={ReceiptText} />
      </div>

      {cobrancasCartao.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          titulo="Nenhuma cobrança por cartão no período"
          descricao="Quando o Asaas registrar e a sincronização importar uma cobrança com pagamento por cartão de crédito, ela aparecerá aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie shadow-sutil dark:border-borda-dark dark:bg-navy">
          <div className="flex items-center justify-between border-b border-borda px-4 py-3 dark:border-borda-dark">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Cobranças sincronizadas</h3>
            <span className="text-xs text-texto-medio">Origem: Asaas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-fundo-sutil text-[10px] uppercase tracking-wide text-texto-medio dark:bg-superficie-dark/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cobrança</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Vencimento</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cobrancasCartao.map((cobranca) => (
                  <tr key={cobranca.id} className="hover:bg-fundo-sutil/70 dark:hover:bg-fundo-sutil/40">
                    <td className="px-4 py-3 font-medium text-texto-medio dark:text-texto-medio-dark">{cobranca.descricao}</td>
                    <td className="px-4 py-3 text-texto-medio dark:text-texto-medio-dark">
                      {cobranca.clienteId ? clientesPorId.get(cobranca.clienteId) || 'Cliente Asaas' : '—'}
                    </td>
                    <td className="px-4 py-3 text-texto-medio dark:text-texto-medio-dark">{formatarDataBR(cobranca.dataVencimento)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusClass[cobranca.status] || statusClass.previsto}`}>
                        {statusLabel[cobranca.status] || cobranca.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">
                      {formatarMoeda(cobranca.status === 'realizado' ? (cobranca.valorRealizado ?? cobranca.valorOrcado) : cobranca.valorOrcado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie shadow-sutil dark:border-borda-dark dark:bg-navy">
        <div className="flex items-center justify-between border-b border-borda px-4 py-3 dark:border-borda-dark">
          <div>
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Itens da fatura importada</h3>
            <p className="mt-0.5 text-[11px] text-texto-medio">Despesas locais originadas de um PDF enviado por você.</p>
          </div>
          <span className="text-xs text-texto-medio">{despesasFatura.length} itens</span>
        </div>
        {despesasFatura.length === 0 ? (
          <p className="p-6 text-center text-xs text-texto-medio">Nenhuma fatura em PDF foi importada para o período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-fundo-sutil text-[10px] uppercase tracking-wide text-texto-medio dark:bg-superficie-dark/60">
                <tr><th className="px-4 py-3 font-semibold">Descrição</th><th className="px-4 py-3 font-semibold">Data</th><th className="px-4 py-3 font-semibold">Situação</th><th className="px-4 py-3 text-right font-semibold">Valor</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {despesasFatura.map((despesa) => (
                  <tr key={despesa.id}><td className="px-4 py-3 font-medium text-texto-medio dark:text-texto-medio-dark">{despesa.descricao}</td><td className="px-4 py-3 text-texto-medio dark:text-texto-medio-dark">{formatarDataBR(despesa.dataVencimento)}</td><td className="px-4 py-3"><span className="rounded-full bg-alerta-suave px-2 py-1 text-[10px] font-bold uppercase text-alerta dark:bg-superficie-dark/50 dark:text-texto-forte-dark">A revisar</span></td><td className="px-4 py-3 text-right font-bold tabular-nums text-perigo">{formatarMoeda(despesa.valorOrcado)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalImportacaoAberto && (
        <ModalImportarFatura
          arquivo={arquivoFatura}
          itens={itensFatura}
          processando={processandoPdf}
          erro={erroPdf}
          onClose={fecharImportacao}
          onSelecionarArquivo={selecionarPdf}
          onAlterarItens={setItensFatura}
          onImportar={importarFatura}
        />
      )}
    </div>
  );
};

interface ModalImportarFaturaProps {
  arquivo: File | null;
  itens: ItemFaturaPdf[];
  processando: boolean;
  erro: string;
  onClose: () => void;
  onSelecionarArquivo: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAlterarItens: React.Dispatch<React.SetStateAction<ItemFaturaPdf[]>>;
  onImportar: () => void;
}

const ModalImportarFatura: React.FC<ModalImportarFaturaProps> = ({
  arquivo, itens, processando, erro, onClose, onSelecionarArquivo, onAlterarItens, onImportar,
}) => {
  const selecionados = itens.filter((item) => item.selecionado);
  const total = selecionados.reduce((soma, item) => soma + item.valorCents, 0);
  const alterarItem = (id: string, alteracoes: Partial<ItemFaturaPdf>) => {
    onAlterarItens((atuais) => atuais.map((item) => item.id === id ? { ...item, ...alteracoes } : item));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-fundo-sutil/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-borda bg-superficie shadow-2xl dark:border-borda-dark dark:bg-navy">
        <div className="flex items-start justify-between border-b border-borda p-5 dark:border-borda-dark">
          <div>
            <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">Importar fatura do cartão</h3>
            <p className="mt-1 text-xs text-texto-medio">O PDF é processado apenas neste navegador. Revise cada item antes de importar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-[var(--radius-controle)] p-1 text-texto-medio hover:bg-fundo-sutil hover:text-texto-medio dark:hover:bg-fundo-sutil"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-primaria bg-primaria-suave/60 px-4 py-5 text-xs font-semibold text-primaria hover:bg-primaria-suave dark:border-borda-dark/70 dark:bg-navy-claro/30 dark:text-primaria-clara">
            {processando ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            <span>{processando ? 'Lendo fatura…' : arquivo ? `Trocar PDF: ${arquivo.name}` : 'Selecionar fatura em PDF'}</span>
            <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={processando} onChange={onSelecionarArquivo} />
          </label>
          <p className="text-[11px] text-texto-medio">Aceita PDF de até 10 MB com texto selecionável. Arquivos digitalizados, protegidos por senha ou com layout incomum podem não ser extraídos.</p>

          {erro && <p className="rounded-[var(--radius-controle)] border border-alerta bg-alerta-suave p-3 text-xs text-alerta dark:border-borda-dark/70 dark:bg-superficie-dark/30 dark:text-texto-forte-dark">{erro}</p>}

          {itens.length > 0 && (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-borda dark:border-borda-dark">
              <div className="flex items-center justify-between border-b border-borda bg-fundo-sutil px-3 py-2 dark:border-borda-dark dark:bg-superficie-dark/60">
                <span className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Prévia: {selecionados.length} itens selecionados</span>
                <span className="text-xs font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">{formatarMoeda(total)}</span>
              </div>
              <div className="max-h-76 overflow-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="sticky top-0 bg-superficie text-[10px] uppercase text-texto-medio dark:bg-navy"><tr><th className="px-3 py-2"></th><th className="px-3 py-2">Data</th><th className="px-3 py-2">Descrição</th><th className="px-3 py-2 text-right">Valor</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {itens.map((item) => (
                      <tr key={item.id} className={!item.selecionado ? 'opacity-50' : ''}>
                        <td className="px-3 py-2"><input type="checkbox" checked={item.selecionado} onChange={(event) => alterarItem(item.id, { selecionado: event.target.checked })} /></td>
                        <td className="px-3 py-2"><input type="date" value={item.data} onChange={(event) => alterarItem(item.id, { data: event.target.value })} className="rounded border border-borda bg-superficie px-1.5 py-1 dark:border-borda-dark dark:bg-navy" /></td>
                        <td className="px-3 py-2"><input value={item.descricao} onChange={(event) => alterarItem(item.id, { descricao: event.target.value })} className="w-full rounded border border-borda bg-superficie px-1.5 py-1 dark:border-borda-dark dark:bg-navy" /></td>
                        <td className="px-3 py-2"><CurrencyInput valueCents={item.valorCents} onChangeCents={(valorCents) => alterarItem(item.id, { valorCents })} className="ml-auto w-28" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-borda p-4 dark:border-borda-dark">
          <button type="button" onClick={onClose} className="rounded-[var(--radius-controle)] bg-fundo-sutil px-4 py-2 text-xs font-semibold text-texto-medio hover:bg-fundo-sutil dark:bg-superficie-dark dark:text-texto-medio-dark">Cancelar</button>
          <button type="button" disabled={!arquivo || selecionados.length === 0 || processando} onClick={onImportar} className="rounded-[var(--radius-controle)] bg-primaria px-4 py-2 text-xs font-semibold text-white hover:bg-primaria-hover disabled:cursor-not-allowed disabled:opacity-50">Importar {selecionados.length || ''} item{selecionados.length === 1 ? '' : 's'}</button>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: 'emerald' | 'amber';
}> = ({ label, value, icon: Icon, tone }) => {
  const iconClass = tone === 'emerald'
    ? 'bg-sucesso-suave text-sucesso dark:bg-superficie-dark/50 dark:text-texto-forte-dark'
    : tone === 'amber'
      ? 'bg-alerta-suave text-alerta dark:bg-superficie-dark/50 dark:text-texto-forte-dark'
      : 'bg-primaria-suave text-primaria dark:bg-navy-claro/50 dark:text-primaria-clara';
  return (
    <div className="rounded-[var(--radius-card)] border border-borda bg-superficie p-4 shadow-sutil dark:border-borda-dark dark:bg-navy">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-texto-medio">{label}</span>
        <span className={`rounded-[var(--radius-controle)] p-2 ${iconClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <strong className="mt-3 block text-xl text-texto-medio dark:text-texto-medio-dark tabular-nums">{value}</strong>
    </div>
  );
};
