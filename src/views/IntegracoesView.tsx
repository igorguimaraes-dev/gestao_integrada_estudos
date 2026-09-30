import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  RotateCw,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  X,
  Search,
  Check,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Integration } from '../types';
import { IntegrationLogo } from '../components/IntegrationLogo';
import { StorageService } from '../financeiro/services/storage';
import type { Categoria, Cliente, ContaBancaria, ExtratoTransacao, Lancamento } from '../financeiro/types';

interface IntegracoesViewProps {
  integrations: Integration[];
  onTriggerActionToast: (msg: string) => void;
}

interface AsaasConnectionStatus {
  configured: boolean;
  persistent?: boolean;
  environment: 'demonstration';
  baseUrl: null;
  generalStatus?: string | null;
}

export const IntegracoesView: React.FC<IntegracoesViewProps> = ({
  integrations = [],
  onTriggerActionToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeIntegrationDetail, setActiveIntegrationDetail] = useState<Integration | null>(null);
  const [asaasConnection, setAsaasConnection] = useState<AsaasConnectionStatus | null>(null);
  const [isTestingAsaasConnection, setIsTestingAsaasConnection] = useState(false);
  const [isSyncingAsaas, setIsSyncingAsaas] = useState(false);
  const [asaasConnectionMessage, setAsaasConnectionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/asaas/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((status) => status && setAsaasConnection(status))
      .catch(() => setAsaasConnection(null));
  }, []);

  const categories = [{ id: 'todos', label: 'Asaas' }];
  const asaasIntegrations = integrations.filter((item) => item.id === 'int-asaas');

  const filtered = asaasIntegrations.filter((item) => {
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.features && item.features.some((f) => f.toLowerCase().includes(query))) ||
      (item.connectedAccount && item.connectedAccount.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const connectedCount = asaasIntegrations.filter((i) => i.status === 'conectado').length;
  const totalEventsToday = asaasIntegrations.reduce((acc, i) => acc + (i.syncEventsToday || 0), 0);
  const isAsaasConfigured = asaasConnection?.configured === true;

  const ativarModoDemonstracao = async () => {
    setIsTestingAsaasConnection(true);
    setAsaasConnectionMessage(null);

    try {
      const response = await fetch('/api/integrations/asaas/test-connection', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Não foi possível validar a conexão.');

      setAsaasConnection({
        configured: true,
        environment: 'demonstration',
        baseUrl: null,
        generalStatus: result.generalStatus,
        persistent: result.persistent,
      });
      setAsaasConnectionMessage('Modo demonstração ativado com dados fictícios locais.');
      onTriggerActionToast('Dados demonstrativos carregados com sucesso.');
    } catch (error) {
      setAsaasConnectionMessage(error instanceof Error ? error.message : 'Não foi possível validar a conexão.');
    } finally {
      setIsTestingAsaasConnection(false);
    }
  };

  const syncAsaasData = async () => {
    setIsSyncingAsaas(true);
    try {
      const response = await fetch('/api/integrations/asaas/sync', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível sincronizar os dados.');

      const today = new Date().toISOString().slice(0, 10);
      const categoria: Categoria = {
        id: 'asaas-receitas',
        grupo: 'Receitas',
        subcategoria: 'Cobranças Asaas',
        tipo: 'receita',
        nome: 'Cobranças Asaas',
      };
      const conta: ContaBancaria = {
        id: 'asaas-saldo-producao',
        nome: 'Saldo demonstrativo',
        banco: 'Asaas',
        tipo: 'gateway',
        saldoInicial: Math.round(Number(data.balance || 0) * 100),
        dataSaldoInicial: today,
        ativa: true,
        corHex: 'var(--color-primaria)',
      };
      const clientes: Cliente[] = (data.customers || []).map((customer: any) => ({
        id: customer.id,
        nomeRazaoSocial: customer.name || 'Cliente sem nome',
        nomeFantasia: customer.company || undefined,
        cnpjCpf: customer.cpfCnpj || '',
        contato: customer.email || customer.mobilePhone || customer.phone || '',
        email: customer.email || undefined,
        telefone: customer.mobilePhone || customer.phone || '',
        planoServico: 'Asaas',
        valorMensal: 0,
        diaVencimento: 1,
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
          id: `asaas-${payment.id}`,
          tipo: 'receita',
          descricao: payment.description || `Cobrança Asaas ${payment.invoiceNumber || payment.id}`,
          categoriaId: categoria.id,
          subcategoria: categoria.subcategoria,
          grupo: categoria.grupo,
          clienteId: payment.customer || undefined,
          contaBancariaId: conta.id,
          mesCompetencia: dataVencimento.slice(0, 7),
          dataVencimento,
          dataPagamento: recebido ? (payment.paymentDate || payment.clientPaymentDate || dataVencimento) : undefined,
          valorOrcado: valorCents,
          valorRealizado: recebido ? valorCents : undefined,
          formaPagamento,
          status: cancelado ? 'cancelado' : recebido ? 'realizado' : vencido ? 'vencido' : 'previsto',
          conciliado: recebido,
          tags: ['asaas', paymentStatus],
        } as Lancamento;
      });

      const extratoTransacoes: ExtratoTransacao[] = (data.financialTransactions || [])
        .filter((transacao: any) => Number.isFinite(Number(transacao.value)) && transacao.date)
        .map((transacao: any) => ({
          id: `asaas-extrato-${transacao.id}`,
          contaBancariaId: conta.id,
          data: transacao.date,
          descricao: transacao.description || transacao.type || 'Movimentação Asaas',
          valorCents: Math.round(Number(transacao.value) * 100),
          conciliado: true,
          lancamentoIdVinculado: Number(transacao.value) < 0
            ? `asaas-despesa-${transacao.id}`
            : transacao.paymentId ? `asaas-${transacao.paymentId}` : undefined,
        }));

      const despesas: Lancamento[] = (data.financialTransactions || [])
        .filter((transacao: any) => Number(transacao.value) < 0 && transacao.date)
        .map((transacao: any) => {
          const dataMovimento = transacao.date;
          const valorCents = Math.round(Math.abs(Number(transacao.value)) * 100);
          return {
            id: `asaas-despesa-${transacao.id}`,
            tipo: 'despesa',
            descricao: transacao.description || transacao.type || 'Débito no extrato Asaas',
            categoriaId: 'asaas-despesas',
            subcategoria: 'Débitos do extrato Asaas',
            grupo: 'Despesas Asaas',
            contaBancariaId: conta.id,
            mesCompetencia: dataMovimento.slice(0, 7),
            dataVencimento: dataMovimento,
            dataPagamento: dataMovimento,
            valorOrcado: valorCents,
            valorRealizado: valorCents,
            formaPagamento: 'outros',
            status: 'realizado',
            conciliado: true,
            observacoes: `Movimento ${transacao.type || 'financeiro'} sincronizado do extrato Asaas.`,
            tags: ['asaas', 'extrato', 'despesa', String(transacao.type || 'DEBITO')],
          } as Lancamento;
        });
      const lancamentos = [...receitas, ...despesas];

      StorageService.replaceAsaasSnapshot({ conta, categoria, clientes, lancamentos, extratoTransacoes });
      onTriggerActionToast(`${clientes.length} clientes e ${lancamentos.length} cobranças foram sincronizados.`);
      setAsaasConnectionMessage('Dados fictícios sincronizados com sucesso.');
    } catch (error) {
      setAsaasConnectionMessage(error instanceof Error ? error.message : 'Não foi possível sincronizar os dados.');
    } finally {
      setIsSyncingAsaas(false);
    }
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-16">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
            <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[24px] font-bold text-[var(--color-texto-forte)]">Integrações & Conectores</h1>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#12A66A] border border-[#D1FADF] inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isAsaasConfigured ? 'bg-[#12A66A] animate-pulse' : 'bg-alerta-suave0'}`}></span>
              {isAsaasConfigured ? 'Modo demonstração ativo' : 'Carregando demonstração'}
            </span>
          </div>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[13px] text-[var(--color-texto-medio)] mt-1">
            Integração oficial do Asaas para gerenciar cobranças, Pix, boletos e assinaturas recorrentes.
          </p>
        </div>

        {/* Global sync action */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
          <button
            id="btn-sync-all-integrations"
            onClick={syncAsaasData}
            disabled={!isAsaasConfigured || isSyncingAsaas}
            title="Sincronizar clientes, cobranças e saldo fictícios."
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-controle)] bg-superficie border border-[var(--color-borda)] text-xs font-semibold text-[var(--color-texto)] transition-colors hover:bg-[var(--color-fundo-sutil)] disabled:cursor-not-allowed disabled:bg-fundo-sutil disabled:text-texto-medio"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[var(--color-primaria)] ${isSyncingAsaas ? 'animate-spin' : ''}`} />
            <span>{isSyncingAsaas ? 'Sincronizando...' : 'Sincronizar Asaas'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil flex items-center justify-between">
          <div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-[var(--color-texto-suave)] uppercase tracking-wider">Status da Integração</span>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-lg font-bold text-[var(--color-texto-forte)] mt-0.5 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAsaasConfigured ? 'bg-sucesso-suave0' : 'bg-alerta-suave0'}`}></span>
              <span>{isAsaasConfigured ? 'Dados locais prontos' : 'Carregando demonstração'}</span>
            </div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)]">Fonte: dados fictícios locais</span>
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-sucesso-suave text-sucesso rounded-[var(--radius-card)]">
            <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil flex items-center justify-between">
          <div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-[var(--color-texto-suave)] uppercase tracking-wider">Eventos Hoje</span>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-lg font-bold text-[var(--color-texto-forte)] mt-0.5">0 eventos sincronizados</div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)]">Eventos serão exibidos após configurar os webhooks</span>
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-[#EEF0FD] text-[var(--color-primaria)] rounded-[var(--radius-card)]">
            <Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil flex items-center justify-between">
          <div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-[var(--color-texto-suave)] uppercase tracking-wider">Conexão Ativa</span>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-lg font-bold text-[var(--color-texto-forte)] mt-0.5">
              {isAsaasConfigured ? '1 de 1 configurada' : '0 de 1 configurada'}
            </div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)]">Sem credenciais externas</span>
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-primaria-suave text-primaria rounded-[var(--radius-card)]">
            <Shield className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat.id === 'todos'
                ? asaasIntegrations.length
                : asaasIntegrations.filter((i) => i.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--color-primaria)] text-white shadow-sutil'
                    : 'bg-superficie text-[var(--color-texto-medio)] hover:bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)]'
                }`}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === cat.id ? 'bg-superficie/25 text-white' : 'bg-fundo-sutil text-texto-medio'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative min-w-[240px]">
          <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[var(--color-texto-suave)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, recurso ou API..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-8 py-1.5 text-xs bg-superficie border border-[var(--color-borda)] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)] focus:ring-1 focus:ring-[var(--color-primaria)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute right-2.5 top-1/2 -translate-y-1/2 text-texto-medio hover:text-texto-medio"
            >
              <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Integrations Grid */}
      {filtered.length === 0 ? (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-12 text-center">
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio">Nenhuma integração encontrada</p>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">Tente ajustar seus termos de busca ou selecione outra categoria.</p>
          <button
            onClick={() => {
              setSelectedCategory('todos');
              setSearchTerm('');
            }}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 px-3.5 py-1.5 bg-[#EEF0FD] text-[var(--color-primaria)] text-xs font-semibold rounded-[var(--radius-controle)] hover:bg-[#E0E4FA]"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isConnected = item.id === 'int-asaas' && isAsaasConfigured;
            const isSoon = item.status === 'em_breve';

            return (
              <div
                key={item.id}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-5 shadow-sutil hover:border-[#CBD5E1] hover:shadow-sutil transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start justify-between gap-3">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 min-w-0">
                      {/* Official Corporate Logo */}
                      <IntegrationLogo logo={item.logo} name={item.name} size="md" />

                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark min-w-0">
                        <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)] truncate group-hover:text-[var(--color-primaria)] transition-colors">
                          {item.name}
                        </h3>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] capitalize block truncate">
                          {item.category === 'pagamentos'
                            ? 'Pagamentos & Cobrança'
                            : item.category === 'assinatura'
                            ? 'Assinatura Eletrônica'
                            : item.category === 'bancos'
                            ? 'Open Finance'
                            : item.category === 'fiscal'
                            ? 'Emissão Fiscal'
                            : item.category === 'comunicacao'
                            ? 'Comunicação'
                            : item.category === 'comercial'
                            ? 'CRM & Comercial'
                            : item.category === 'contabilidade'
                            ? 'ERP & Contabilidade'
                            : item.category === 'arquivos'
                            ? 'Arquivos & Nuvem'
                            : item.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isConnected
                          ? 'bg-sucesso-suave text-sucesso border border-sucesso'
                          : isSoon
                          ? 'bg-fundo-sutil text-texto-medio'
                          : 'bg-alerta-suave text-alerta border border-alerta'
                      }`}
                    >
                      {isConnected ? '✓ CONECTADO' : isSoon ? 'EM BREVE' : 'CONFIGURAR'}
                    </span>
                  </div>

                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[#475467] mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Connected Account Label */}
                  {isConnected && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 text-[11px] text-texto-medio bg-[var(--color-fundo-sutil)] px-2.5 py-1.5 rounded-[var(--radius-controle)] border border-borda flex items-center gap-1.5 truncate">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-sucesso-suave0 shrink-0"></span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark truncate">Dados demonstrativos ativos</span>
                    </div>
                  )}

                  {/* Feature Tags */}
                  {item.features && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 flex flex-wrap gap-1">
                      {item.features.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-md text-[10px] bg-[#F6F7FB] text-[#475467] border border-[#ECEEF5]"
                        >
                          {f}
                        </span>
                      ))}
                      {item.features.length > 3 && (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-1.5 py-0.5 rounded-md text-[10px] text-[var(--color-texto-medio)]">
                          +{item.features.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-5 pt-3 border-t border-[var(--color-borda)] flex items-center justify-between text-xs">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 text-[11px] text-[var(--color-texto-suave)]">
                    <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                    <span>{isConnected ? 'Demonstração disponível' : 'Carregando demonstração'}</span>
                  </div>

                  <button
                    onClick={() => setActiveIntegrationDetail(item)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:text-[#4344D1] inline-flex items-center gap-1 group/btn"
                  >
                    <span>{isConnected ? 'Gerenciar' : 'Configurar'}</span>
                    <ChevronRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Integration Detail Modal */}
      {activeIntegrationDetail && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--color-borda)] space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-[var(--color-borda)]">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                {/* Official Corporate Logo in Modal */}
                <IntegrationLogo
                  logo={activeIntegrationDetail.logo}
                  name={activeIntegrationDetail.name}
                  size="lg"
                />
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-[var(--color-texto-forte)]">
                    {activeIntegrationDetail.name}
                  </h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)]">
                    {activeIntegrationDetail.connectedAccount || 'Conta do Workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveIntegrationDetail(null)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded-[var(--radius-controle)] hover:bg-fundo-sutil transition-colors"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3.5 text-xs">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-[#ECFDF3] border border-[#D1FADF] rounded-[var(--radius-card)] text-sucesso flex items-start gap-2.5">
                <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[#12A66A] shrink-0 mt-0.5" />
                <div>
                  <strong>Status da Conexão:</strong>{' '}
                  {isAsaasConfigured
                    ? `Modo demonstração ativo${asaasConnection?.generalStatus ? ` (${asaasConnection.generalStatus})` : ''}.`
                    : 'Carregando o modo demonstração.'}
                </div>
              </div>

              <section className="dark:bg-fundo-dark dark:text-texto-forte-dark rounded-[var(--radius-card)] border border-[var(--color-borda)] bg-[var(--color-fundo-sutil)] p-3 space-y-2.5">
                <div>
                  <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Dados fictícios para estudo</h4>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-0.5 text-[11px] text-[var(--color-texto-medio)]">
                    Nenhuma credencial é solicitada, armazenada ou enviada. A sincronização usa apenas dados locais de demonstração.
                  </p>
                </div>
                {asaasConnectionMessage && (
                  <p className={`text-[11px] ${isAsaasConfigured ? 'text-sucesso' : 'text-perigo'}`}>
                    {asaasConnectionMessage}
                  </p>
                )}
                <button
                  type="button"
                  onClick={ativarModoDemonstracao}
                  disabled={isTestingAsaasConnection}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full rounded-[var(--radius-controle)] bg-[var(--color-primaria)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4849D6] disabled:cursor-wait disabled:opacity-60"
                >
                  {isTestingAsaasConnection ? 'Carregando dados...' : 'Recarregar dados demonstrativos'}
                </button>
              </section>

              <div>
                <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)] mb-2">Recursos Habilitados</h4>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeIntegrationDetail.features.map((feat, idx) => (
                    <div key={idx} className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 p-2 bg-[var(--color-fundo-sutil)] rounded-[var(--radius-controle)] border border-[var(--color-borda)]">
                      <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[#12A66A] shrink-0" />
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)] text-[11px] font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark pt-2 border-t border-[var(--color-borda)]">
                <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)] mb-1.5 flex items-center justify-between">
                  <span>Eventos de Sincronização</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] font-normal text-texto-medio">Aguardando webhook</span>
                </h4>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] bg-[var(--color-fundo-sutil)] p-3 rounded-[var(--radius-controle)] border border-[var(--color-borda)]">
                  Nenhum evento externo é processado no modo demonstração.
                </div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark pt-1">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-suave)]">
                  ID da demonstração: <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-mono text-texto-medio">{activeIntegrationDetail.id}</span>
                </span>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center pt-3 border-t border-[var(--color-borda)]">
              <button
                type="button"
                disabled
                title="O modo demonstração não utiliza webhooks externos."
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3.5 py-2 rounded-[var(--radius-controle)] bg-fundo-sutil text-texto-medio text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
              >
                <RotateCw className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Sincronização em configuração</span>
              </button>

              <button
                onClick={() => setActiveIntegrationDetail(null)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3.5 py-2 border border-[var(--color-borda)] hover:bg-fundo-sutil rounded-[var(--radius-controle)] text-xs font-medium text-[var(--color-texto)] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
