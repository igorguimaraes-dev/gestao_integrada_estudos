import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Upload,
  Calendar,
  Building,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  DollarSign,
  HelpCircle,
  Eye,
  Sliders,
  Layers,
  FileCheck,
  Undo2,
  TrendingDown,
  TrendingUp,
  Pencil,
  Plus,
} from 'lucide-react';
import { BankAccount, BankTransaction, RouteId } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';
import { IntegrationLogo } from '../components/IntegrationLogo';
import { syncAsaasToFinance } from '../financeiro/services/asaasSync';
import { StorageService } from '../financeiro/services/storage';
import type { Categoria } from '../financeiro/types';

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type EstadoFinanceiroPersistido = Record<string, unknown>;
type CategoriaDoExtrato = { id: string; nome?: string; subcategoria?: string; grupo?: string; tipo: 'receita' | 'despesa' };

const rotuloPeriodo = (periodo: string): string => {
  const [ano, mes] = periodo.split('-').map(Number);
  return `${NOMES_MESES[(mes || 1) - 1] || NOMES_MESES[0]} de ${ano || new Date().getFullYear()}`;
};

const avancarPeriodo = (periodo: string, deslocamento: number): string => {
  const [ano, mes] = periodo.split('-').map(Number);
  const data = new Date(Date.UTC(ano || new Date().getFullYear(), (mes || 1) - 1 + deslocamento, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
};

const formatarData = (data?: string): string => {
  if (!data || !/^\d{4}-\d{2}-\d{2}/.test(data)) return '—';
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const canalDoExtrato = (descricao: string): BankTransaction['channel'] => {
  const texto = descricao.toLocaleLowerCase('pt-BR');
  if (texto.includes('pix')) return 'pix';
  if (texto.includes('boleto') || texto.includes('fatura')) return 'boleto';
  if (texto.includes('taxa') || texto.includes('tarifa')) return 'tarifa';
  if (texto.includes('cartão') || texto.includes('cartao')) return 'debito_automatico';
  return 'outro';
};

function adaptarSnapshotAsaas(estado: EstadoFinanceiroPersistido): {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  latestPeriod?: string;
} {
  const contas = Array.isArray(estado.gestao_fin_contas_v1) ? estado.gestao_fin_contas_v1 as Array<Record<string, unknown>> : [];
  const lancamentos = Array.isArray(estado.gestao_fin_lancamentos_v1) ? estado.gestao_fin_lancamentos_v1 as Array<Record<string, unknown>> : [];
  const extrato = Array.isArray(estado.gestao_fin_extrato_transacoes_v1) ? estado.gestao_fin_extrato_transacoes_v1 as Array<Record<string, unknown>> : [];
  const clientes = Array.isArray(estado.gestao_fin_clientes_v1) ? estado.gestao_fin_clientes_v1 as Array<Record<string, unknown>> : [];
  const categorias = Array.isArray(estado.gestao_fin_categorias_v1) ? estado.gestao_fin_categorias_v1 as CategoriaDoExtrato[] : [];

  const contasAsaas = contas.filter((conta) =>
    String(conta.banco || '').toLocaleLowerCase('pt-BR') === 'asaas' || String(conta.id || '').startsWith('asaas-')
  );
  const lancamentosPorId = new Map(lancamentos.map((lancamento) => [String(lancamento.id), lancamento]));
  const clientesPorId = new Map(clientes.map((cliente) => [String(cliente.id), cliente]));

  const transactions: BankTransaction[] = extrato
    .filter((movimento) => !movimento.ignorado && contasAsaas.some((conta) => String(conta.id) === String(movimento.contaBancariaId)))
    .map((movimento) => {
      const lancamento = lancamentosPorId.get(String(movimento.lancamentoIdVinculado || ''));
      const cliente = lancamento ? clientesPorId.get(String(lancamento.clienteId || '')) : undefined;
      const descricao = String(movimento.descricao || 'Movimentação Asaas');
      const valor = Number(movimento.valorCents || 0) / 100;
      const data = String(movimento.data || '');
      const categoriaId = String(movimento.categoriaId || '');
      const categoriaCadastrada = categorias.find((item) => item.id === categoriaId);
      const vinculada = Boolean(movimento.conciliado);
      const categoria = String(movimento.categoriaNome || categoriaCadastrada?.nome || categoriaCadastrada?.subcategoria || '');
      const favorecido = String(cliente?.nomeRazaoSocial || cliente?.nomeFantasia || lancamento?.descricao || 'Asaas');

      return {
        id: String(movimento.id),
        accountId: String(movimento.contaBancariaId),
        date: formatarData(data),
        dayOfWeek: data ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${data.slice(0, 10)}T12:00:00Z`)) : undefined,
        rawDescription: descricao,
        amount: valor,
        type: valor < 0 ? 'pagamento' : 'recebimento',
        channel: canalDoExtrato(descricao),
        status: vinculada ? 'conciliado' : 'pendente',
        matchedDescription: String(movimento.descricaoConciliada || (vinculada ? lancamento?.descricao || descricao : '')),
        matchedCategory: categoria,
        matchedCategoryId: categoriaId || undefined,
        matchedSupplierOrClient: favorecido,
        matchedCostCenter: String(categoriaCadastrada?.grupo || lancamento?.grupo || 'Asaas'),
        matchedDocumentId: lancamento ? String(lancamento.id) : undefined,
        reconciledAt: vinculada ? formatarData(data) : undefined,
        reconciledBy: vinculada ? 'Integração Asaas' : undefined,
        aiAnalysis: vinculada ? {
          confidence: 1,
          explanation: 'Movimentação vinculada automaticamente ao lançamento sincronizado do Asaas.',
          interpretedEntity: favorecido,
          interpretedCategory: categoria,
          interpretedCostCenter: String(lancamento?.grupo || 'Asaas'),
          autoMatchRule: 'Vínculo da integração Asaas',
        } : undefined,
      };
    });

  const ultimoExtratoPorConta = new Map<string, string>();
  transactions.forEach((movimento) => {
    const dataIso = extrato.find((item) => String(item.id) === movimento.id)?.data;
    const anterior = ultimoExtratoPorConta.get(movimento.accountId);
    if (typeof dataIso === 'string' && (!anterior || dataIso > anterior)) ultimoExtratoPorConta.set(movimento.accountId, dataIso);
  });

  const accounts: BankAccount[] = contasAsaas.map((conta) => {
    const id = String(conta.id);
    const movimentosPendentes = transactions.filter((movimento) => movimento.accountId === id && movimento.status === 'pendente');
    const dataSaldo = typeof conta.dataSaldoInicial === 'string' ? conta.dataSaldoInicial : undefined;
    return {
      id,
      bankName: String(conta.nome || 'Asaas Conta Digital'),
      bankCode: 'asaas',
      agency: 'Asaas',
      accountNumber: 'Conta digital',
      currentBalance: Number(conta.saldoInicial || 0) / 100,
      reconciledBalance: Number(conta.saldoInicial || 0) / 100,
      pendingReconciliationAmount: movimentosPendentes.reduce((total, movimento) => total + Math.abs(movimento.amount), 0),
      pendingReconciliationCount: movimentosPendentes.length,
      lastSyncDate: dataSaldo ? `Sincronizado em ${formatarData(dataSaldo)}` : 'Aguardando sincronização',
      lastImportedDate: formatarData(ultimoExtratoPorConta.get(id)),
      provider: 'asaas',
    };
  });

  const latestPeriod = extrato
    .map((movimento) => String(movimento.data || '').slice(0, 7))
    .filter((periodo) => /^\d{4}-\d{2}$/.test(periodo))
    .sort()
    .at(-1);

  return { accounts, transactions, latestPeriod };
}

interface ConciliacaoBancariaViewProps {
  accounts?: BankAccount[];
  transactions?: BankTransaction[];
  onReconcileTransaction?: (id: string, matchData: Partial<BankTransaction>) => void;
  onBatchReconcile?: (ids: string[]) => void;
  onImportTransactions?: (newTxs: BankTransaction[]) => void;
  onTriggerToast?: (title: string, desc?: string) => void;
  onNavigate?: (route: RouteId) => void;
  hideValues?: boolean;
}

export const ConciliacaoBancariaView: React.FC<ConciliacaoBancariaViewProps> = ({
  accounts = [],
  transactions: initialTxList = [],
  onReconcileTransaction,
  onBatchReconcile,
  onImportTransactions,
  onTriggerToast = (_title: string, _desc?: string) => {},
  onNavigate = (_route: RouteId) => {},
  hideValues = false,
}) => {
  // Active bank account
  const [integratedAccounts, setIntegratedAccounts] = useState<BankAccount[] | null>(null);
  const [categoriasFinanceiras, setCategoriasFinanceiras] = useState<CategoriaDoExtrato[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'asaas-saldo-producao');
  const [isSyncingAsaas, setIsSyncingAsaas] = useState(false);
  const [integrationLoadError, setIntegrationLoadError] = useState<string | null>(null);
  const fallbackAccount: BankAccount = {
    id: 'acc-itau',
    bankName: 'Itaú - CC',
    bankCode: '341',
    agency: '0451',
    accountNumber: '19.824-3',
    currentBalance: -8433.59,
    reconciledBalance: 51820.62,
    pendingReconciliationAmount: 60254.21,
    pendingReconciliationCount: 5,
    lastSyncDate: '05/09/2026 às 07h37',
    lastImportedDate: '04/09/2026',
    provider: 'open_finance',
  };

  // Main navigation tabs: 'pendentes' vs 'movimentacoes' (matching Conta Azul screenshot)
  const [mainTab, setMainTab] = useState<'pendentes' | 'movimentacoes'>('pendentes');

  // Filter states
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'recebimentos' | 'pagamentos'>('todos');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>('2026-09');

  // Interactive local transactions state for live updates
  const [txs, setTxs] = useState<BankTransaction[]>(initialTxList);

  const aplicarSnapshotAsaas = useCallback((estado: EstadoFinanceiroPersistido) => {
    const snapshot = adaptarSnapshotAsaas(estado);
    setIntegratedAccounts(snapshot.accounts);
    setTxs(snapshot.transactions);
    setCategoriasFinanceiras(Array.isArray(estado.gestao_fin_categorias_v1) ? estado.gestao_fin_categorias_v1 as CategoriaDoExtrato[] : []);
    setSelectedTxIds([]);
    setSelectedAccountId(snapshot.accounts[0]?.id || 'asaas-saldo-producao');
    if (snapshot.latestPeriod) setCurrentPeriod(snapshot.latestPeriod);
  }, []);

  const carregarDadosAsaas = useCallback(async () => {
    const response = await fetch('/api/persistence/state');
    if (!response.ok) throw new Error('Não foi possível ler os dados sincronizados do Asaas.');
    const payload = await response.json();
    aplicarSnapshotAsaas((payload?.state || {}) as EstadoFinanceiroPersistido);
  }, [aplicarSnapshotAsaas]);

  useEffect(() => {
    carregarDadosAsaas().catch(() => {
      setIntegrationLoadError('Não foi possível carregar o snapshot da integração Asaas.');
    });
  }, [carregarDadosAsaas]);

  const sincronizarAsaas = async () => {
    setIsSyncingAsaas(true);
    setIntegrationLoadError(null);
    try {
      const resumo = await syncAsaasToFinance();
      await StorageService.sincronizarComBanco();
      await carregarDadosAsaas();
      onTriggerToast('Asaas sincronizado', `${resumo.transacoesExtrato} movimentações do extrato foram atualizadas.`);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Não foi possível sincronizar com o Asaas.';
      setIntegrationLoadError(mensagem);
      onTriggerToast('Falha ao sincronizar Asaas', mensagem);
    } finally {
      setIsSyncingAsaas(false);
    }
  };

  const persistirStatusConciliacao = (ids: string[], conciliado: boolean, ignorado = false) => {
    const atualizadas = StorageService.getExtratoTransacoes().map((movimento) =>
      ids.includes(movimento.id)
        ? { ...movimento, conciliado, ignorado }
        : movimento
    );
    StorageService.saveExtratoTransacoes(atualizadas);
    void StorageService.sincronizarComBanco();
  };

  const persistirClassificacao = (tx: BankTransaction, conciliado: boolean) => {
    const categoria = categoriasFinanceiras.find((item) => item.id === tx.matchedCategoryId);
    const extrato = StorageService.getExtratoTransacoes();
    const movimento = extrato.find((item) => item.id === tx.id);
    StorageService.saveExtratoTransacoes(extrato.map((item) => item.id === tx.id ? {
      ...item,
      conciliado,
      descricaoConciliada: tx.matchedDescription.trim(),
      categoriaId: tx.matchedCategoryId,
      categoriaNome: categoria?.nome || categoria?.subcategoria || tx.matchedCategory,
    } : item));

    if (movimento?.lancamentoIdVinculado) {
      StorageService.saveLancamentosBatch(StorageService.getLancamentos().map((lancamento) =>
        lancamento.id === movimento.lancamentoIdVinculado ? {
          ...lancamento,
          descricao: tx.matchedDescription.trim(),
          categoriaId: categoria?.id || lancamento.categoriaId,
          grupo: categoria?.grupo || lancamento.grupo,
          subcategoria: categoria?.nome || categoria?.subcategoria || lancamento.subcategoria,
          conciliado,
        } : lancamento
      ));
    }
    void StorageService.sincronizarComBanco();
  };

  // Esta tela é uma visão do extrato da integração vigente; não mistura contas demonstrativas do app.
  const availableAccounts = integratedAccounts ?? [];
  const activeAccount = availableAccounts.find((account) => account.id === selectedAccountId) || availableAccounts[0] || {
    ...fallbackAccount,
    id: 'asaas-saldo-producao',
    bankName: 'Asaas Conta Digital',
    bankCode: 'asaas',
    currentBalance: 0,
    reconciledBalance: 0,
    pendingReconciliationAmount: 0,
    pendingReconciliationCount: 0,
    lastSyncDate: 'Aguardando sincronização',
    lastImportedDate: '—',
    provider: 'asaas' as const,
  };

  // Modal and drawer states
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showAiInspectionModal, setShowAiInspectionModal] = useState<BankTransaction | null>(null);
  const [showCategoryAnalysisModal, setShowCategoryAnalysisModal] = useState<boolean>(false);
  const [criandoCategoriaPara, setCriandoCategoriaPara] = useState<string | null>(null);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novoGrupoCategoria, setNovoGrupoCategoria] = useState('');
  const [isAiProcessingBatch, setIsAiProcessingBatch] = useState<boolean>(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState<boolean>(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<boolean>(false);

  // Filter transactions for active bank account
  const accountTxs = txs.filter((t) => {
    const [, , mes, ano] = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t.date) || [];
    return t.accountId === activeAccount.id && `${ano || ''}-${mes || ''}` === currentPeriod;
  });

  const pendingTxs = accountTxs.filter((t) => t.status === 'pendente');
  const reconciledTxs = accountTxs.filter((t) => t.status === 'conciliado');
  const pendingAmount = pendingTxs.reduce((total, tx) => total + Math.abs(tx.amount), 0);

  // Apply search and type filters
  const currentList = mainTab === 'pendentes' ? pendingTxs : reconciledTxs;
  const filteredTxs = currentList.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.rawDescription.toLowerCase().includes(search.toLowerCase()) ||
      t.matchedDescription.toLowerCase().includes(search.toLowerCase()) ||
      t.matchedCategory.toLowerCase().includes(search.toLowerCase()) ||
      t.matchedSupplierOrClient.toLowerCase().includes(search.toLowerCase()) ||
      Math.abs(t.amount).toString().includes(search);

    const matchesType =
      typeFilter === 'todos' ||
      (typeFilter === 'recebimentos' && t.type === 'recebimento') ||
      (typeFilter === 'pagamentos' && t.type === 'pagamento');

    return matchesSearch && matchesType;
  });

  // Totals for filter badges
  const totalCount = currentList.length;
  const receiptsCount = currentList.filter((t) => t.type === 'recebimento').length;
  const paymentsCount = currentList.filter((t) => t.type === 'pagamento').length;
  const despesasPorCategoria = Object.values(
    accountTxs
      .filter((tx) => tx.amount < 0)
      .reduce<Record<string, { nome: string; total: number; quantidade: number }>>((acumulado, tx) => {
        const nome = tx.matchedCategory || 'Débitos do extrato Asaas';
        const atual = acumulado[nome] || { nome, total: 0, quantidade: 0 };
        atual.total += Math.abs(tx.amount);
        atual.quantidade += 1;
        acumulado[nome] = atual;
        return acumulado;
      }, {})
  ).sort((a, b) => b.total - a.total);
  const totalDespesasDoPeriodo = despesasPorCategoria.reduce((total, categoria) => total + categoria.total, 0);

  // Single transaction reconcile
  const handleReconcile = (tx: BankTransaction) => {
    if (!tx.matchedDescription.trim() || !tx.matchedCategoryId) {
      onTriggerToast('Classificação necessária', 'Informe uma descrição e selecione uma categoria antes de conciliar.');
      return;
    }
    const updated: BankTransaction = {
      ...tx,
      status: 'conciliado',
      reconciledAt: new Date().toLocaleString('pt-BR'),
      reconciledBy: 'IA Conciliadora (Aprovado pelo Usuário)',
    };
    setTxs((prev) => prev.map((item) => (item.id === tx.id ? updated : item)));
    persistirClassificacao(updated, true);
    if (onReconcileTransaction) {
      onReconcileTransaction(tx.id, updated);
    }
    onTriggerToast(
      'Lançamento Conciliado com IA',
      `O pagamento ${tx.rawDescription} (${formatCurrencyDetailed(Math.abs(tx.amount))}) foi conciliado com sucesso.`
    );
  };

  // Batch reconcile with AI
  const handleBatchReconcileWithAi = () => {
    setIsAiProcessingBatch(true);
    setTimeout(() => {
      const idsToReconcile = selectedTxIds.length > 0 ? selectedTxIds : pendingTxs.map((t) => t.id);
      const transacoesParaConciliar = pendingTxs.filter((tx) => idsToReconcile.includes(tx.id));
      const semClassificacao = transacoesParaConciliar.filter((tx) => !tx.matchedDescription.trim() || !tx.matchedCategoryId);
      if (semClassificacao.length > 0) {
        setIsAiProcessingBatch(false);
        onTriggerToast('Classificação necessária', `${semClassificacao.length} movimentação(ões) ainda precisam de descrição e categoria.`);
        return;
      }
      const timestamp = new Date().toLocaleString('pt-BR');

      setTxs((prev) =>
        prev.map((t) => {
          if (idsToReconcile.includes(t.id)) {
            return {
              ...t,
              status: 'conciliado',
              reconciledAt: timestamp,
              reconciledBy: 'IA Conciliadora Automática (100% de Correspondência)',
            };
          }
          return t;
        })
      );
      transacoesParaConciliar.forEach((tx) => persistirClassificacao({
        ...tx,
        status: 'conciliado',
        reconciledAt: timestamp,
        reconciledBy: 'Conciliação em lote',
      }, true));

      if (onBatchReconcile) {
        onBatchReconcile(idsToReconcile);
      }

      setIsAiProcessingBatch(false);
      setSelectedTxIds([]);
      onTriggerToast(
        'Conciliação em Lote Concluída!',
        `A IA leu e conciliou com sucesso ${idsToReconcile.length} pagamentos bancários pendentes.`
      );
    }, 1200);
  };

  // Toggle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(filteredTxs.map((t) => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reabre a classificação sem descartar as informações já preenchidas.
  const handleEditarClassificacao = (tx: BankTransaction) => {
    setTxs((prev) =>
      prev.map((item) => (item.id === tx.id ? { ...item, status: 'pendente', reconciledAt: undefined, reconciledBy: undefined } : item))
    );
    persistirStatusConciliacao([tx.id], false);
    setMainTab('pendentes');
    onTriggerToast('Classificação reaberta', 'Você pode corrigir a descrição ou categoria e conciliar novamente.');
  };

  const abrirCriacaoCategoria = (tx: BankTransaction) => {
    setCriandoCategoriaPara(tx.id);
    setNovaCategoriaNome('');
    setNovoGrupoCategoria(tx.type === 'recebimento' ? 'Receitas de serviços' : 'Despesas operacionais');
  };

  const criarCategoriaRapida = (tx: BankTransaction) => {
    const nome = novaCategoriaNome.trim();
    if (!nome) {
      onTriggerToast('Nome necessário', 'Informe o nome da nova categoria.');
      return;
    }
    const categoria: Categoria = {
      id: `cat_${tx.type === 'recebimento' ? 'receita' : 'despesa'}_${Date.now()}`,
      tipo: tx.type === 'recebimento' ? 'receita' : 'despesa',
      nome,
      subcategoria: nome,
      grupo: novoGrupoCategoria.trim() || (tx.type === 'recebimento' ? 'Receitas gerais' : 'Despesas gerais'),
      ativa: true,
      subcategorias: [],
    };
    StorageService.saveCategoria(categoria);
    void StorageService.sincronizarComBanco();
    setCategoriasFinanceiras((prev) => [...prev, categoria]);
    setTxs((prev) => prev.map((item) => item.id === tx.id ? {
      ...item,
      matchedCategoryId: categoria.id,
      matchedCategory: categoria.nome || categoria.subcategoria,
      matchedCostCenter: categoria.grupo,
    } : item));
    setCriandoCategoriaPara(null);
    onTriggerToast('Categoria criada', `“${nome}” foi selecionada neste lançamento.`);
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-20">
      {/* Top Header & Account Switcher (Matches Conta Azul Pro Interface) */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-5 shadow-sutil">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Account Selector & Actions */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 flex-wrap">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative">
              <button
                id="btn-switch-bank-account"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 px-3.5 py-2 rounded-[var(--radius-controle)] border border-[#D0D5DD] bg-superficie hover:bg-fundo-sutil text-sm font-bold text-[var(--color-texto-forte)] transition-colors"
              >
                {/* Bank Mini Logo */}
                {activeAccount.bankCode === '341' ? (
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-6 h-6 rounded-md bg-[#EC7000] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    it
                  </div>
                ) : activeAccount.bankCode === 'asaas' ? (
                  <IntegrationLogo logo="asaas" size="sm" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-6 h-6 rounded-md" />
                ) : (
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-6 h-6 rounded-md bg-[#CC0000] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    SAN
                  </div>
                )}
                <span>{activeAccount.bankName}</span>
                <ChevronDown className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio" />
              </button>

              {accountDropdownOpen && (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute left-0 top-full mt-1.5 w-64 bg-superficie border border-[var(--color-borda)] rounded-[var(--radius-card)] shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 text-[11px] font-bold text-texto-medio uppercase tracking-wider">
                    Contas Bancárias
                  </div>
                  {availableAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setAccountDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-[var(--color-fundo-sutil)] transition-colors ${
                        acc.id === selectedAccountId ? 'bg-[#EEF0FD] text-[var(--color-primaria)] font-bold' : 'text-[var(--color-texto)]'
                      }`}
                    >
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        {acc.bankCode === '341' ? (
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 rounded-xs bg-[#EC7000] text-white flex items-center justify-center font-bold text-[10px]">
                            it
                          </div>
                        ) : acc.bankCode === 'asaas' ? (
                          <IntegrationLogo logo="asaas" size="sm" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 rounded-xs" />
                        ) : (
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 rounded-xs bg-[#CC0000] text-white flex items-center justify-center font-bold text-[10px]">
                            SAN
                          </div>
                        )}
                        <span>{acc.bankName}</span>
                      </div>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">
                        {formatCurrency(acc.currentBalance, hideValues)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ações da Conta Dropdown */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative">
              <button
                id="btn-account-actions"
                onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3 py-2 rounded-[var(--radius-controle)] border border-[#D0D5DD] bg-superficie hover:bg-fundo-sutil text-xs font-semibold text-[var(--color-texto)] transition-colors"
              >
                <span>Ações da conta</span>
                <ChevronDown className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
              </button>

              {actionsDropdownOpen && (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute left-0 top-full mt-1.5 w-60 bg-superficie border border-[var(--color-borda)] rounded-[var(--radius-card)] shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setActionsDropdownOpen(false);
                      void sincronizarAsaas();
                    }}
                    disabled={isSyncingAsaas}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-fundo-sutil text-texto-medio disabled:cursor-wait disabled:opacity-60"
                  >
                    <RefreshCw className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-sucesso" />
                    <span>{isSyncingAsaas ? 'Sincronizando Asaas...' : 'Sincronizar dados do Asaas'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActionsDropdownOpen(false);
                      setShowCategoryAnalysisModal(true);
                    }}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-fundo-sutil text-texto-medio border-t border-borda"
                  >
                    <Sliders className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-primaria" />
                    <span>Regras e Aprendizado da IA</span>
                  </button>
                </div>
              )}
            </div>

            {/* Análise por categorias */}
            <button
              onClick={() => setShowCategoryAnalysisModal(true)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3 py-2 rounded-[var(--radius-controle)] border border-[#D0D5DD] bg-superficie hover:bg-fundo-sutil text-xs font-semibold text-[var(--color-texto)] transition-colors"
            >
              <Layers className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
              <span>Análise por categorias</span>
            </button>
            <button
              onClick={() => onNavigate('financeiro-categorias')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3 py-2 rounded-[var(--radius-controle)] border border-[#D0D5DD] bg-superficie hover:bg-fundo-sutil text-xs font-semibold text-[var(--color-texto)] transition-colors"
            >
              <Layers className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-primaria" />
              <span>Gerenciar categorias</span>
            </button>
          </div>

          {/* Period Selector: < Setembro de 2026 > */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 self-start lg:self-center">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1 bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)] rounded-[var(--radius-controle)] p-1">
              <button
                onClick={() => setCurrentPeriod((periodo) => avancarPeriodo(periodo, -1))}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded hover:bg-superficie transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-0.5 text-xs font-bold text-texto-medio select-none">
                {rotuloPeriodo(currentPeriod)}
              </span>
              <button
                onClick={() => setCurrentPeriod((periodo) => avancarPeriodo(periodo, 1))}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded hover:bg-superficie transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Header Metadata and Balances (Matching Conta Azul Banner) */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-5 pt-4 border-t border-[var(--color-borda)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 text-texto-medio">
              <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
              <span>Última sincronização Asaas:</span>
            </div>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio mt-0.5">
              {activeAccount.lastSyncDate}
            </p>
          </div>

          <div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 text-texto-medio">
              <FileCheck className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
              <span>Última movimentação do extrato:</span>
            </div>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio mt-0.5">
              {activeAccount.lastImportedDate}
            </p>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[#F8F9FC] p-3 rounded-[var(--radius-controle)] border border-[var(--color-borda)]">
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block text-[11px]">Saldo atual informado pelo Asaas</span>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-perigo mt-0.5">
              {formatCurrencyDetailed(activeAccount.currentBalance, hideValues)}
            </div>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[#EEF0FD] p-3 rounded-[var(--radius-controle)] border border-[#D5D8FA]">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-primaria)] font-bold text-[11px]">Movimentações sem vínculo</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-primaria)] text-white">
                {pendingTxs.length} pendentes
              </span>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-extrabold text-[var(--color-texto-forte)] mt-0.5">
              {formatCurrencyDetailed(pendingAmount, hideValues)}
            </div>
          </div>
        </div>
        {integrationLoadError && (
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 rounded-[var(--radius-controle)] border border-alerta bg-alerta-suave px-3 py-2 text-xs text-alerta">
            {integrationLoadError}
          </p>
        )}
      </div>

      {/* Main Tabs: Conciliações pendentes vs Movimentações */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark border-b border-[var(--color-borda)] flex items-center justify-between gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-8">
          <button
            onClick={() => setMainTab('pendentes')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              mainTab === 'pendentes'
                ? 'border-[var(--color-primaria)] text-[var(--color-primaria)]'
                : 'border-transparent text-texto-medio hover:text-texto-medio'
            }`}
          >
            <span>Conciliações pendentes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                mainTab === 'pendentes' ? 'bg-primaria-suave text-primaria' : 'bg-fundo-sutil text-texto-medio'
              }`}
            >
              {pendingTxs.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('movimentacoes')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              mainTab === 'movimentacoes'
                ? 'border-[var(--color-primaria)] text-[var(--color-primaria)]'
                : 'border-transparent text-texto-medio hover:text-texto-medio'
            }`}
          >
            <span>Movimentações</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                mainTab === 'movimentacoes' ? 'bg-primaria-suave text-primaria' : 'bg-fundo-sutil text-texto-medio'
              }`}
            >
              {reconciledTxs.length}
            </span>
          </button>
        </div>

        {/* AI Batch Reconciliation Highlight Button */}
        {mainTab === 'pendentes' && pendingTxs.length > 0 && (
          <button
            id="btn-batch-reconcile-ai"
            onClick={handleBatchReconcileWithAi}
            disabled={isAiProcessingBatch}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark mb-2.5 px-4 py-2 bg-gradient-to-r from-[var(--color-primaria)] to-[#7C3AED] hover:from-[#4849D6] hover:to-[#6D28D9] text-white rounded-[var(--radius-controle)] text-xs font-bold shadow-sutil transition-all flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isAiProcessingBatch ? 'animate-spin' : ''}`} />
            <span>
              {isAiProcessingBatch
                ? 'IA analisando e conciliando...'
                : selectedTxIds.length > 0
                ? `Conciliar ${selectedTxIds.length} selecionados com IA`
                : 'Conciliar todos com IA (1-Clique)'}
            </span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil space-y-3">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
            <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquise o lançamento bancário (Descrição ou valor)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-8 py-2 text-xs bg-superficie border border-[#D0D5DD] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)] focus:ring-1 focus:ring-[var(--color-primaria)]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute right-2.5 top-1/2 -translate-y-1/2 text-texto-medio hover:text-texto-medio"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-primaria hover:underline font-medium"
              >
                Limpar filtros
              </button>
            )}

            <button
              onClick={() => onTriggerToast('Arquivo de Lançamentos', 'Nenhum lançamento arquivado para esta conta.')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio hover:text-texto-medio font-medium"
            >
              Ver lançamentos arquivados
            </button>
          </div>
        </div>

        {/* Counter Pills: Todos | Recebimentos | Pagamentos */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between border-t border-borda pt-3">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
            <button
              onClick={() => setTypeFilter('todos')}
              className={`px-3 py-1 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                typeFilter === 'todos'
                  ? 'bg-navy text-white'
                  : 'bg-fundo-sutil text-texto-medio hover:bg-fundo-sutil'
              }`}
            >
              <span>Todos</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold">{totalCount}</span>
            </button>

            <button
              onClick={() => setTypeFilter('recebimentos')}
              className={`px-3 py-1 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                typeFilter === 'recebimentos'
                  ? 'bg-sucesso-suave text-white'
                  : 'bg-sucesso-suave text-sucesso hover:bg-sucesso-suave'
              }`}
            >
              <span>Recebimentos</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold">{receiptsCount}</span>
            </button>

            <button
              onClick={() => setTypeFilter('pagamentos')}
              className={`px-3 py-1 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                typeFilter === 'pagamentos'
                  ? 'bg-perigo-suave text-white'
                  : 'bg-perigo-suave text-perigo hover:bg-perigo-suave'
              }`}
            >
              <span>Pagamentos</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold">{paymentsCount}</span>
            </button>
          </div>

          {/* Action toolbar (matches Conta Azul) */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(selectedTxIds.length !== filteredTxs.length)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio hover:text-texto-medio px-2.5 py-1 rounded border border-borda bg-superficie"
            >
              {selectedTxIds.length === filteredTxs.length && filteredTxs.length > 0
                ? 'Desmarcar todos'
                : 'Selecionar todos'}
            </button>

            {selectedTxIds.length > 0 && (
              <button
                onClick={handleBatchReconcileWithAi}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-white px-3 py-1 rounded bg-[var(--color-primaria)] hover:bg-primaria-suave flex items-center gap-1.5"
              >
                <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Conciliar ({selectedTxIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Headers: Lançamentos do banco | Lançamentos da Conta Azul / Sistema */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark hidden lg:grid grid-cols-12 gap-6 px-4 text-xs font-bold text-texto-medio uppercase tracking-wider">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark col-span-5 flex items-center gap-2">
          {activeAccount.bankCode === '341' ? (
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 rounded-xs bg-[#EC7000] text-white flex items-center justify-center text-[9px] font-bold">
              it
            </div>
          ) : (
            <IntegrationLogo logo="asaas" size="sm" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 rounded-xs" />
          )}
          <span>Lançamentos do banco ({activeAccount.bankName})</span>
        </div>
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark col-span-2 text-center">Ação / Match IA</div>
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark col-span-5 flex items-center gap-2">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 rounded-full bg-[var(--color-primaria)]"></div>
          <span>Lançamento financeiro vinculado / integração Asaas</span>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTxs.length === 0 ? (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-12 text-center space-y-3">
          <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-12 h-12 text-sucesso mx-auto" />
          <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
            {mainTab === 'pendentes'
              ? 'Tudo em dia! Nenhuma conciliação pendente.'
              : 'Nenhuma movimentação encontrada neste período.'}
          </h3>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio max-w-md mx-auto">
            {mainTab === 'pendentes'
              ? 'Todas as movimentações bancárias desta conta já foram lidas pela IA e devidamente conciliadas com o financeiro.'
              : 'Altere os filtros de busca ou sincronize novamente os dados do Asaas.'}
          </p>
          {mainTab === 'pendentes' && (
            <button
              onClick={() => setMainTab('movimentacoes')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-[#EEF0FD] text-[var(--color-primaria)] text-xs font-bold hover:bg-[#E0E4FA]"
            >
              Ver Movimentações Conciliadas
            </button>
          )}
        </div>
      ) : (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
          {filteredTxs.map((tx) => {
            const isNegative = tx.amount < 0;
            const isSelected = selectedTxIds.includes(tx.id);
            const isReconciled = tx.status === 'conciliado';

            return (
              <div
                key={tx.id}
                className={`bg-superficie rounded-[var(--radius-card)] border transition-all p-5 shadow-sutil ${
                  isSelected
                    ? 'border-[var(--color-primaria)] ring-1 ring-[var(--color-primaria)] bg-[#FAFAFE]'
                    : isReconciled
                    ? 'border-sucesso bg-sucesso-suave/20'
                    : 'border-[var(--color-borda)] hover:border-borda-forte'
                }`}
              >
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* LEFT SIDE: Lançamentos do Banco (Matches exact layout in user screenshot) */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark lg:col-span-5 space-y-3">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                        {!isReconciled && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(tx.id)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[var(--color-primaria)] rounded border-borda-forte focus:ring-[var(--color-primaria)]"
                          />
                        )}
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {tx.date} {tx.dayOfWeek && <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-normal text-texto-medio">• {tx.dayOfWeek}</span>}
                        </span>
                      </div>

                      {/* Transaction Amount */}
                      <span
                        className={`text-sm font-extrabold font-mono tracking-tight ${
                          isNegative ? 'text-perigo' : 'text-sucesso'
                        }`}
                      >
                        {isNegative ? 'R$ -' : 'R$ +'}
                        {Math.abs(tx.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {/* Raw Description from Bank Statement */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[var(--color-fundo-sutil)] p-3 rounded-[var(--radius-controle)] border border-[var(--color-borda)] space-y-1.5">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-extrabold text-[var(--color-texto-forte)] font-mono tracking-tight">
                          {tx.rawDescription}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-fundo-sutil text-texto-medio">
                          {tx.channel}
                        </span>
                      </div>

                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio space-y-0.5">
                        <p>
                          <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">Cliente/Fornecedor:</strong>{' '}
                          {tx.counterpartyRaw || 'Informação não recebida'}
                        </p>
                        <p>
                          <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">CPF/CNPJ:</strong>{' '}
                          {tx.cpfCnpjRaw || 'Informação não recebida'}
                        </p>
                      </div>
                    </div>

                    {/* Bank Card Footer */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-[11px] text-texto-medio pt-1">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1.5 text-texto-medio">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-sucesso-suave0"></span>
                        Integração bancária ({activeAccount.bankName})
                      </span>

                      {!isReconciled && (
                        <button
                          onClick={() => {
                            setTxs((prev) => prev.filter((item) => item.id !== tx.id));
                            persistirStatusConciliacao([tx.id], false, true);
                            onTriggerToast('Lançamento Arquivado', 'O lançamento foi movido para os arquivados.');
                          }}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio hover:underline"
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CENTER CONNECTOR: Conciliar Button & AI Confidence */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark lg:col-span-2 flex flex-col items-center justify-center gap-2 py-2">
                    {!isReconciled ? (
                      <>
                        <button
                          id={`btn-conciliar-${tx.id}`}
                          onClick={() => handleReconcile(tx)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full max-w-[130px] py-2 px-3 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-bold shadow-sutil transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                          <span>Salvar e conciliar</span>
                        </button>

                        {tx.aiAnalysis && (
                          <button
                            onClick={() => setShowAiInspectionModal(tx)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primaria)] hover:underline bg-[#EEF0FD] px-2 py-0.5 rounded-full"
                            title="Ver como a IA leu e interpretou este pagamento"
                          >
                            <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-[var(--color-primaria)]" />
                            <span>{Math.round(tx.aiAnalysis.confidence * 100)}% Match IA</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-center space-y-1">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 text-xs font-bold text-sucesso bg-sucesso-suave px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-sucesso" />
                          <span>Conciliado</span>
                        </span>
                        <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">
                          {tx.reconciledAt?.split(' às ')[0]}
                        </p>
                        <button
                          onClick={() => handleEditarClassificacao(tx)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center justify-center gap-1 text-[10px] text-texto-medio hover:text-[var(--color-primaria)] underline"
                        >
                          <Pencil className="dark:bg-fundo-dark dark:text-texto-forte-dark h-3 w-3" />
                          Editar classificação
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RIGHT SIDE: Lançamentos da Conta Azul / Sistema & Sugestão da IA */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark lg:col-span-5 space-y-3 bg-[#FDFDFE] p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)]">
                    {!isReconciled ? (
                      <>
                        {/* Sub-tabs: Novo lançamento | Nova transferência | Buscar lançamento */}
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between border-b border-borda pb-2">
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded text-[11px] font-bold bg-[var(--color-primaria)] text-white">
                              Classificar lançamento
                            </span>
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-1 rounded text-[11px] font-medium text-texto-medio hover:text-texto-medio cursor-pointer">
                              Descrição e categoria obrigatórias
                            </span>
                          </div>

                          {tx.aiAnalysis?.suggestedDocumentCode && (
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-sucesso bg-sucesso-suave px-2 py-0.5 rounded font-mono font-bold">
                              {tx.aiAnalysis.suggestedDocumentCode}
                            </span>
                          )}
                        </div>

                        {/* AI-filled input fields with lightning icons */}
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-texto-medio flex items-center gap-1 mb-1">
                              <span>Descrição *</span>
                              <span title="Sugerido pela IA"><Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-[var(--color-primaria)]" /></span>
                            </label>
                            <input
                              type="text"
                              value={tx.matchedDescription}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTxs((prev) =>
                                  prev.map((item) =>
                                    item.id === tx.id ? { ...item, matchedDescription: val } : item
                                  )
                                );
                              }}
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-2.5 py-1.5 text-xs bg-superficie border border-[#D0D5DD] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)]"
                            />
                          </div>

                          <div>
                            <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-texto-medio flex items-center gap-1 mb-1">
                              <span>Categoria *</span>
                              <span title="Sugerido pela IA"><Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-[var(--color-primaria)]" /></span>
                            </label>
                            <select
                              value={tx.matchedCategoryId || ''}
                              onChange={(e) => {
                                const categoria = categoriasFinanceiras.find((item) => item.id === e.target.value);
                                setTxs((prev) => prev.map((item) => item.id === tx.id ? {
                                  ...item,
                                  matchedCategoryId: e.target.value || undefined,
                                  matchedCategory: categoria?.nome || categoria?.subcategoria || '',
                                  matchedCostCenter: categoria?.grupo || item.matchedCostCenter,
                                } : item));
                              }}
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-2.5 py-1.5 text-xs bg-superficie border border-[#D0D5DD] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)]"
                            >
                              <option value="">Selecione uma categoria</option>
                              {categoriasFinanceiras.filter((categoria) => categoria.tipo === (tx.type === 'recebimento' ? 'receita' : 'despesa')).map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>{categoria.nome || categoria.subcategoria}{categoria.grupo ? ` · ${categoria.grupo}` : ''}</option>
                              ))}
                            </select>
                            {criandoCategoriaPara === tx.id ? (
                              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2 space-y-2 rounded-[var(--radius-controle)] border border-primaria bg-primaria-suave/60 p-2.5">
                                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between gap-2">
                                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] font-bold text-primaria">Nova categoria de {tx.type === 'recebimento' ? 'receita' : 'despesa'}</span>
                                  <button type="button" onClick={() => setCriandoCategoriaPara(null)} className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio hover:text-texto-medio">Cancelar</button>
                                </div>
                                <input autoFocus value={novaCategoriaNome} onChange={(event) => setNovaCategoriaNome(event.target.value)} placeholder="Nome da categoria" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full rounded-md border border-primaria bg-superficie px-2 py-1.5 text-xs outline-none focus:border-primaria" />
                                <input value={novoGrupoCategoria} onChange={(event) => setNovoGrupoCategoria(event.target.value)} placeholder="Grupo / centro de resultado" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full rounded-md border border-primaria bg-superficie px-2 py-1.5 text-xs outline-none focus:border-primaria" />
                                <button type="button" onClick={() => criarCategoriaRapida(tx)} className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 rounded-md bg-primaria px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-primaria-hover"><Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark h-3 w-3" /> Criar e selecionar</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => abrirCriacaoCategoria(tx)} className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primaria)] hover:underline"><Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark h-3.5 w-3.5" /> Criar nova categoria</button>
                            )}
                          </div>

                          <div>
                            <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-texto-medio block mb-1">
                              Fornecedor / Favorecido
                            </label>
                            <input
                              type="text"
                              value={tx.matchedSupplierOrClient}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTxs((prev) =>
                                  prev.map((item) =>
                                    item.id === tx.id ? { ...item, matchedSupplierOrClient: val } : item
                                  )
                                );
                              }}
                              placeholder="Selecione o fornecedor"
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-2.5 py-1.5 text-xs bg-superficie border border-[#D0D5DD] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)]"
                            />
                          </div>

                          <div>
                            <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-texto-medio block mb-1">
                              Centro de custo
                            </label>
                            <input
                              type="text"
                              value={tx.matchedCostCenter}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTxs((prev) =>
                                  prev.map((item) =>
                                    item.id === tx.id ? { ...item, matchedCostCenter: val } : item
                                  )
                                );
                              }}
                              placeholder="Centro de custo"
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-2.5 py-1.5 text-xs bg-superficie border border-[#D0D5DD] rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)]"
                            />
                          </div>
                        </div>

                        {/* Card footer options */}
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-[11px] pt-1 border-t border-borda">
                          <button
                            onClick={() => onTriggerToast('Regra de Repetição Salva', `A IA lembrará de categorizar "${tx.rawDescription}" sempre como "${tx.matchedCategory}".`)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-primaria)] hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <RefreshCw className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            <span>Repetir lançamento</span>
                          </button>

                          <button
                            onClick={() => setShowAiInspectionModal(tx)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio hover:underline"
                          >
                            Completar informações
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Reconciled Summary */
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{tx.matchedDescription}</span>
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded text-[11px] bg-sucesso-suave text-sucesso font-semibold">
                            {tx.matchedCategory}
                          </span>
                        </div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio space-y-0.5">
                          <p>Fornecedor/Cliente: <strong>{tx.matchedSupplierOrClient}</strong></p>
                          <p>Centro de Custo: <strong>{tx.matchedCostCenter}</strong></p>
                          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">Conciliado por: {tx.reconciledBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: AI Inspection / Explicabilidade da Leitura da IA */}
      {showAiInspectionModal && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--color-borda)] space-y-5">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-[var(--color-borda)]">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-9 h-9 rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-primaria)] to-[#7C3AED] text-white flex items-center justify-center shadow-sutil">
                  <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-[var(--color-texto-forte)]">
                    Leitura Inteligente da IA
                  </h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                    Análise semântica e cruzamento de dados com o financeiro
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiInspectionModal(null)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded-[var(--radius-controle)] hover:bg-fundo-sutil"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3.5 text-xs">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3.5 bg-[var(--color-fundo-sutil)] rounded-[var(--radius-card)] border border-[var(--color-borda)] space-y-2">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">Linha bruta do extrato bancário:</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-mono font-bold text-perigo">
                    {formatCurrencyDetailed(showAiInspectionModal.amount)}
                  </span>
                </div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark font-mono font-bold text-sm text-texto-medio bg-superficie p-2 rounded border border-borda">
                  {showAiInspectionModal.rawDescription}
                </p>
              </div>

              {showAiInspectionModal.aiAnalysis && (
                <>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-sucesso-suave border border-sucesso rounded-[var(--radius-card)] text-sucesso space-y-1.5">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                      <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso flex items-center gap-1.5">
                        <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-sucesso" />
                        Grau de Certeza da IA: {Math.round(showAiInspectionModal.aiAnalysis.confidence * 100)}%
                      </strong>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] font-bold px-2 py-0.5 bg-sucesso-suave text-sucesso rounded-full">
                        Alta Precisão
                      </span>
                    </div>
                    <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs leading-relaxed text-sucesso">
                      {showAiInspectionModal.aiAnalysis.explanation}
                    </p>
                  </div>

                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-2 text-xs">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-fundo-sutil rounded-[var(--radius-controle)] border border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block text-[10px]">Entidade / Fornecedor Identificado</span>
                      <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{showAiInspectionModal.aiAnalysis.interpretedEntity}</strong>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-fundo-sutil rounded-[var(--radius-controle)] border border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block text-[10px]">Categoria Sugerida</span>
                      <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{showAiInspectionModal.aiAnalysis.interpretedCategory}</strong>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-fundo-sutil rounded-[var(--radius-controle)] border border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block text-[10px]">Centro de Custo</span>
                      <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{showAiInspectionModal.aiAnalysis.interpretedCostCenter}</strong>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-fundo-sutil rounded-[var(--radius-controle)] border border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block text-[10px]">Regra de Aprendizado</span>
                      <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{showAiInspectionModal.aiAnalysis.autoMatchRule || 'Histórico'}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center pt-3 border-t border-[var(--color-borda)]">
              <button
                onClick={() => {
                  handleReconcile(showAiInspectionModal);
                  setShowAiInspectionModal(null);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                <span>Confirmar & Conciliar Agora</span>
              </button>

              <button
                onClick={() => setShowAiInspectionModal(null)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 border border-[var(--color-borda)] rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Importar Extrato OFX/CSV */}
      {showImportModal && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--color-borda)] space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-[var(--color-borda)]">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-9 h-9 rounded-[var(--radius-card)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center">
                  <Upload className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
                    Importar Extrato Bancário
                  </h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                    Compatível com arquivos .OFX e .CSV do Itaú, Santander, Bradesco e Asaas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded-[var(--radius-controle)]"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4 text-xs">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark border-2 border-dashed border-borda-forte rounded-[var(--radius-card)] p-8 text-center hover:border-[var(--color-primaria)] transition-colors cursor-pointer bg-fundo-sutil hover:bg-primaria-suave/20">
                <Upload className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 text-texto-medio mx-auto mb-2" />
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio text-sm">
                  Arraste seu arquivo .OFX ou .CSV aqui
                </p>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio mt-1 text-xs">
                  A nossa IA fará a leitura automática de todos os débitos e créditos
                </p>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-4 inline-block px-4 py-2 bg-superficie border border-borda-forte rounded-[var(--radius-controle)] font-bold text-texto-medio hover:bg-fundo-sutil cursor-pointer shadow-sutil">
                  Selecionar arquivo do computador
                  <input
                    type="file"
                    accept=".ofx,.csv,.txt"
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setShowImportModal(false);
                        onTriggerToast('Arquivo Importado com Sucesso', `Extrato ${e.target.files[0].name} lido e analisado pela IA.`);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-primaria-suave border border-primaria rounded-[var(--radius-card)] text-primaria text-xs flex items-start gap-2">
                <Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-primaria shrink-0 mt-0.5" />
                <span>
                  <strong>Dica de Produtividade:</strong> Com a integração Pluggy / Open Finance ativa, você não precisa importar arquivos manualmente. Os extratos caem automaticamente todos os dias às 06h00.
                </span>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end gap-2 pt-3 border-t border-borda">
              <button
                onClick={() => setShowImportModal(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 border border-borda-forte rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Análise por Categorias */}
      {showCategoryAnalysisModal && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[var(--color-borda)] space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-[var(--color-borda)]">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-9 h-9 rounded-[var(--radius-card)] bg-primaria-suave text-primaria flex items-center justify-center">
                  <Layers className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
                    Análise de Pagamentos por Categoria (IA)
                  </h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                    Débitos identificados no extrato Asaas de {rotuloPeriodo(currentPeriod)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryAnalysisModal(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio rounded-[var(--radius-controle)]"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3 text-xs">
              {despesasPorCategoria.length === 0 ? (
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark rounded-[var(--radius-controle)] bg-fundo-sutil p-4 text-center text-texto-medio">
                  Não há débitos no extrato Asaas para este período.
                </p>
              ) : despesasPorCategoria.map((categoria) => (
                <div key={categoria.nome} className="dark:bg-fundo-dark dark:text-texto-forte-dark rounded-[var(--radius-controle)] bg-fundo-sutil p-3 flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">{categoria.nome}</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{categoria.quantidade} movimentação(ões) do extrato Asaas</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">{formatCurrencyDetailed(categoria.total, hideValues)}</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">
                      {totalDespesasDoPeriodo ? `${((categoria.total / totalDespesasDoPeriodo) * 100).toFixed(1)}% do total` : '0,0% do total'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark hidden">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-controle)] flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">Outras Despesas / Terceiros (SISPAG)</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">7 fornecedores e prestadores</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">R$ 26.801,42</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">44.5% do total</span>
                  </div>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-controle)] flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">Mídia Paga (Meta Platforms Ads)</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Campanhas e tráfego de clientes</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">R$ 15.450,00</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">25.6% do total</span>
                  </div>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-controle)] flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">Impostos & Tributos Federais (DARF Simples)</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">DAS Competência 08/2026</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">R$ 9.842,19</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">16.3% do total</span>
                  </div>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-controle)] flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">Pró-Labore & Sócios (Pix Marlon)</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Retirada quinzenal</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">R$ 6.710,00</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">11.1% do total</span>
                  </div>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-controle)] flex items-center justify-between">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio block">Infraestrutura & Consumo (Enel SP)</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Energia elétrica sede Moema</span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-perigo block">R$ 1.450,60</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio">2.4% do total</span>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end pt-3 border-t border-borda">
              <button
                onClick={() => setShowCategoryAnalysisModal(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 bg-navy text-white rounded-[var(--radius-controle)] text-xs font-bold"
              >
                Concluir Análise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
