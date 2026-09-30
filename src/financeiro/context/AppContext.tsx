import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  ContaBancaria,
  Categoria,
  Cliente,
  Fornecedor,
  Lancamento,
  CartaoCredito,
  ReembolsoSocio,
  CenarioSimulacao,
  MetaOrcamento,
  RegraExtrato,
  ExtratoTransacao,
  ConfiguracoesGerais,
  RegimeVisualizacao,
  TipoFiltroPeriodo,
  TipoLancamento,
  ScopeSerie,
} from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';
import { getDataHojeISO, getMesAtualISO } from '../utils/formatters';
import { calcularStatusLancamento } from '../utils/calculations';

export interface ToastItem {
  id: string;
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'info';
}

export interface ConfirmDialogState {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  confirmTexto?: string;
  cancelTexto?: string;
  perigo?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  // Para exclusão de categoria com lançamentos
  selectCategoriaDestino?: boolean;
  categoriaOrigemId?: string;
  onConfirmComDestino?: (destinoId: string) => void;
}

export interface NovoLancamentoModalState {
  aberto: boolean;
  tipo?: TipoLancamento;
  prefill?: Partial<Lancamento>;
  lancamentoEditando?: Lancamento;
}

export interface ScopeDialogState {
  aberto: boolean;
  lancamento?: Lancamento;
  acao: 'editar' | 'excluir';
  novosDados?: Partial<Lancamento>;
}

interface AppContextType {
  // Dados
  contas: ContaBancaria[];
  categorias: Categoria[];
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  lancamentos: Lancamento[];
  cartoes: CartaoCredito[];
  reembolsos: ReembolsoSocio[];
  cenarios: CenarioSimulacao[];
  metas: MetaOrcamento[];
  metasOrcamentarias: MetaOrcamento[];
  salvarMeta: (meta: MetaOrcamento) => void;
  regrasExtrato: RegraExtrato[];
  extratoTransacoes: ExtratoTransacao[];
  configuracoes: ConfiguracoesGerais;

  // Filtros Globais
  tipoPeriodo: TipoFiltroPeriodo;
  setTipoPeriodo: (tipo: TipoFiltroPeriodo) => void;
  mesSelecionado: string; // YYYY-MM
  setMesSelecionado: (mes: string) => void;
  trimestreSelecionado: number; // 1-4
  setTrimestreSelecionado: (tri: number) => void;
  anoSelecionado: number; // YYYY
  setAnoSelecionado: (ano: number) => void;
  intervaloPersonalizado: { inicio: string; fim: string };
  setIntervaloPersonalizado: (intervalo: { inicio: string; fim: string }) => void;

  // Regime de visualização (Caixa x Competência)
  regime: RegimeVisualizacao;
  setRegime: (regime: RegimeVisualizacao) => void;

  // Helpers de período
  intervaloPeriodoAtual: { inicio: string; fim: string };
  mesesDoPeriodoAtual: string[];
  isLancamentoNoPeriodo: (l: Lancamento) => boolean;

  // Tema
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Navegação
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Toasts
  toasts: ToastItem[];
  showToast: (mensagem: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  removeToast: (id: string) => void;

  // Diálogo de confirmação
  confirmDialog: ConfirmDialogState;
  openConfirm: (options: Omit<ConfirmDialogState, 'aberto'>) => void;
  closeConfirm: () => void;

  // Modal Novo/Editar Lançamento
  modalNovoLancamento: NovoLancamentoModalState;
  abrirModalNovoLancamento: (tipo?: TipoLancamento, prefill?: Partial<Lancamento>, lancamentoEditando?: Lancamento) => void;
  fecharModalNovoLancamento: () => void;

  // Modal de Escopo de Série Recorrente
  scopeDialog: ScopeDialogState;
  abrirScopeDialog: (lancamento: Lancamento, acao: 'editar' | 'excluir', novosDados?: Partial<Lancamento>) => void;
  fecharScopeDialog: () => void;
  executarAcaoSerie: (scope: ScopeSerie) => void;

  // Ações de persistência
  salvarLancamento: (lancamento: Lancamento) => void;
  salvarLancamentosEmLote: (lancamentos: Lancamento[]) => void;
  salvarExtratoTransacoes: (transacoes: ExtratoTransacao[]) => void;
  excluirLancamento: (id: string, scope?: ScopeSerie) => void;
  marcarComoRealizadoRapido: (id: string, valorRealizado?: number, dataPagamento?: string) => void;
  duplicarLancamento: (lancamento: Lancamento) => void;
  cancelarLancamento: (id: string) => void;

  salvarConta: (conta: ContaBancaria) => void;
  excluirConta: (id: string) => void;

  salvarCategoria: (cat: Categoria) => void;
  excluirCategoria: (id: string, categoriaDestinoId?: string) => void;

  salvarCliente: (cli: Cliente, gerarLancamentos?: boolean) => void;
  excluirCliente: (id: string, cancelarFuturos?: boolean) => void;

  salvarFornecedor: (forn: Fornecedor, gerarLancamentos?: boolean) => void;
  excluirFornecedor: (id: string) => void;

  salvarCartao: (cartao: CartaoCredito) => void;
  excluirCartao: (id: string) => void;

  salvarReembolso: (reembolso: ReembolsoSocio) => void;
  excluirReembolso: (id: string) => void;

  salvarCenario: (cenario: CenarioSimulacao) => void;
  excluirCenario: (id: string) => void;

  salvarConfiguracoes: (config: ConfiguracoesGerais) => void;
  carregarDadosFicticios: () => void;
  resetAll: () => void;
  limparTodosOsDados: () => void;
  exportarBackupJSON: () => void;
  importarBackupJSON: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode; initialTab?: string }> = ({ children, initialTab = 'dashboard' }) => {
  // Ano corrente como padrão conforme especificação (ano atual do sistema)
  const dataHoje = getDataHojeISO();
  const anoAtual = parseInt(dataHoje.split('-')[0], 10);
  const mesAtual = getMesAtualISO();

  // Estados dos dados
  const [contas, setContas] = useState<ContaBancaria[]>(() => StorageService.getContas());
  const [categorias, setCategorias] = useState<Categoria[]>(() => StorageService.getCategorias());
  const [clientes, setClientes] = useState<Cliente[]>(() => StorageService.getClientES());
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() => StorageService.getFornecedores());
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(() => StorageService.getLancamentos());
  const [cartoes, setCartoes] = useState<CartaoCredito[]>(() => StorageService.getCartoes());
  const [reembolsos, setReembolsos] = useState<ReembolsoSocio[]>(() => StorageService.getReembolsos());
  const [cenarios, setCenarios] = useState<CenarioSimulacao[]>(() => StorageService.getCenarios());
  const [metas, setMetas] = useState<MetaOrcamento[]>(() => StorageService.getMetas());
  const [regrasExtrato, setRegrasExtrato] = useState<RegraExtrato[]>(() => StorageService.getRegrasExtrato());
  const [extratoTransacoes, setExtratoTransacoes] = useState<ExtratoTransacao[]>(() => StorageService.getExtratoTransacoes());
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesGerais>(() => StorageService.getConfiguracoes());

  // Filtros de período globais (Padrão: ano corrente)
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoFiltroPeriodo>('mes');
  const [mesSelecionado, setMesSelecionado] = useState<string>(mesAtual);
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<number>(Math.floor((new Date().getMonth() + 3) / 3));
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);
  const [intervaloPersonalizado, setIntervaloPersonalizado] = useState<{ inicio: string; fim: string }>({
    inicio: `${anoAtual}-01-01`,
    fim: `${anoAtual}-12-31`,
  });

  // Regime de visualização (Caixa x Competência)
  const [regime, setRegime] = useState<RegimeVisualizacao>('caixa');

  // Tema
  const [theme, setTheme] = useState<'light' | 'dark'>(() => StorageService.getTheme());

  // Navegação
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Diálogo de confirmação
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    aberto: false,
    titulo: '',
    mensagem: '',
    onConfirm: () => {},
  });

  // Modal Novo Lançamento
  const [modalNovoLancamento, setModalNovoLancamento] = useState<NovoLancamentoModalState>({
    aberto: false,
  });

  // Modal Scope de Série
  const [scopeDialog, setScopeDialog] = useState<ScopeDialogState>({
    aberto: false,
    acao: 'editar',
  });

  // Atualização reativa de storage
  useEffect(() => {
    const unsub = subscribeToStorage(() => {
      setContas(StorageService.getContas());
      setCategorias(StorageService.getCategorias());
      setClientes(StorageService.getClientES());
      setFornecedores(StorageService.getFornecedores());
      setLancamentos(StorageService.getLancamentos());
      setCartoes(StorageService.getCartoes());
      setReembolsos(StorageService.getReembolsos());
      setCenarios(StorageService.getCenarios());
      setMetas(StorageService.getMetas());
      setRegrasExtrato(StorageService.getRegrasExtrato());
      setExtratoTransacoes(StorageService.getExtratoTransacoes());
      setConfiguracoes(StorageService.getConfiguracoes());
    });
    return unsub;
  }, []);

  // Carrega o estado persistido no PostgreSQL; o cache local permanece como contingência offline.
  useEffect(() => {
    StorageService.hidratarDoBanco().catch(() => {
      // O banco pode ainda não estar configurado no ambiente local.
    });
  }, []);

  // Mantém as telas financeiras no mesmo mês escolhido no seletor do cabeçalho.
  useEffect(() => {
    const meses: Record<string, string> = {
      janeiro: '01', fevereiro: '02', 'março': '03', abril: '04', maio: '05', junho: '06',
      julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
    };
    const atualizarPeriodo = (event: Event) => {
      const valor = (event as CustomEvent<string>).detail;
      const correspondencia = /^(.+) de (\d{4})$/i.exec(valor || '');
      if (correspondencia) {
        const mes = meses[correspondencia[1].toLocaleLowerCase('pt-BR')];
        if (!mes) return;
        setTipoPeriodo('mes');
        setMesSelecionado(`${correspondencia[2]}-${mes}`);
        return;
      }
      const trimestre = /^(\d)º Trimestre (\d{4})$/i.exec(valor || '');
      if (trimestre) {
        setTipoPeriodo('trimestre');
        setTrimestreSelecionado(Number(trimestre[1]));
        setAnoSelecionado(Number(trimestre[2]));
        return;
      }
      const ano = /^Ano (\d{4})$/i.exec(valor || '');
      if (ano) {
        setTipoPeriodo('ano');
        setAnoSelecionado(Number(ano[1]));
      }
    };
    window.addEventListener('gestao-financeiro-periodo', atualizarPeriodo);
    return () => window.removeEventListener('gestao-financeiro-periodo', atualizarPeriodo);
  }, []);

  // Sincroniza classe dark no elemento <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (mensagem: string, tipo: 'sucesso' | 'erro' | 'info' = 'sucesso') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openConfirm = (options: Omit<ConfirmDialogState, 'aberto'>) => {
    setConfirmDialog({ ...options, aberto: true });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, aberto: false }));
  };

  const abrirModalNovoLancamento = (
    tipo?: TipoLancamento,
    prefill?: Partial<Lancamento>,
    lancamentoEditando?: Lancamento
  ) => {
    setModalNovoLancamento({
      aberto: true,
      tipo,
      prefill,
      lancamentoEditando,
    });
  };

  const fecharModalNovoLancamento = () => {
    setModalNovoLancamento({ aberto: false });
  };

  const abrirScopeDialog = (
    lancamento: Lancamento,
    acao: 'editar' | 'excluir',
    novosDados?: Partial<Lancamento>
  ) => {
    setScopeDialog({
      aberto: true,
      lancamento,
      acao,
      novosDados,
    });
  };

  const fecharScopeDialog = () => {
    setScopeDialog({ aberto: false, acao: 'editar' });
  };

  const executarAcaoSerie = (scope: ScopeSerie) => {
    if (!scopeDialog.lancamento) return;
    if (scopeDialog.acao === 'excluir') {
      StorageService.deleteLancamento(scopeDialog.lancamento.id, scope);
      showToast('Lançamento(s) excluído(s) com sucesso!');
    } else if (scopeDialog.acao === 'editar' && scopeDialog.novosDados) {
      StorageService.updateLancamentoSerie(scopeDialog.lancamento.id, scopeDialog.novosDados, scope);
      showToast('Lançamento(s) atualizado(s) com sucesso!');
    }
    fecharScopeDialog();
  };

  // Cálculo do intervalo do período ativo
  const intervaloPeriodoAtual = useMemo(() => {
    if (tipoPeriodo === 'mes') {
      const [ano, mes] = mesSelecionado.split('-').map(Number);
      const ultimoDia = new Date(ano, mes, 0).getDate();
      return {
        inicio: `${mesSelecionado}-01`,
        fim: `${mesSelecionado}-${String(ultimoDia).padStart(2, '0')}`,
      };
    }
    if (tipoPeriodo === 'trimestre') {
      const mesInicio = (trimestreSelecionado - 1) * 3 + 1;
      const mesFim = trimestreSelecionado * 3;
      const ultimoDia = new Date(anoSelecionado, mesFim, 0).getDate();
      return {
        inicio: `${anoSelecionado}-${String(mesInicio).padStart(2, '0')}-01`,
        fim: `${anoSelecionado}-${String(mesFim).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
      };
    }
    if (tipoPeriodo === 'ano') {
      return {
        inicio: `${anoSelecionado}-01-01`,
        fim: `${anoSelecionado}-12-31`,
      };
    }
    return intervaloPersonalizado;
  }, [tipoPeriodo, mesSelecionado, trimestreSelecionado, anoSelecionado, intervaloPersonalizado]);

  // Lista de meses do período atual ('YYYY-MM')
  const mesesDoPeriodoAtual = useMemo(() => {
    const meses: string[] = [];
    const [anoIni, mesIni] = intervaloPeriodoAtual.inicio.split('-').map(Number);
    const [anoFim, mesFim] = intervaloPeriodoAtual.fim.split('-').map(Number);

    let curAno = anoIni;
    let curMes = mesIni;

    while (curAno < anoFim || (curAno === anoFim && curMes <= mesFim)) {
      meses.push(`${curAno}-${String(curMes).padStart(2, '0')}`);
      curMes++;
      if (curMes > 12) {
        curMes = 1;
        curAno++;
      }
    }
    return meses;
  }, [intervaloPeriodoAtual]);

  // Filtro de lançamento no período
  const isLancamentoNoPeriodo = (l: Lancamento): boolean => {
    // Regime de Caixa: usa dataPagamento se houver, ou dataVencimento
    // Regime de Competência: usa mesCompetencia
    if (regime === 'caixa') {
      const data = l.dataPagamento || l.dataVencimento;
      return data >= intervaloPeriodoAtual.inicio && data <= intervaloPeriodoAtual.fim;
    } else {
      const mesL = l.mesCompetencia;
      const mesIni = intervaloPeriodoAtual.inicio.substring(0, 7);
      const mesFim = intervaloPeriodoAtual.fim.substring(0, 7);
      return mesL >= mesIni && mesL <= mesFim;
    }
  };

  // Funções de CRUD
  const salvarLancamento = (lancamento: Lancamento) => {
    // Recalcular status automaticamente
    const statusAtualizado = calcularStatusLancamento({
      status: lancamento.status,
      valorOrcado: lancamento.valorOrcado,
      valorRealizado: lancamento.valorRealizado,
      dataVencimento: lancamento.dataVencimento,
      dataPagamento: lancamento.dataPagamento,
      justificativaDivergencia: lancamento.justificativaDivergencia,
    });
    const lancamentoFinal = { ...lancamento, status: statusAtualizado };
    StorageService.saveLancamento(lancamentoFinal);
    showToast('Lançamento salvo com sucesso!');
  };

  const salvarLancamentosEmLote = (novos: Lancamento[]) => {
    const comStatus = novos.map((l) => ({
      ...l,
      status: calcularStatusLancamento({
        status: l.status,
        valorOrcado: l.valorOrcado,
        valorRealizado: l.valorRealizado,
        dataVencimento: l.dataVencimento,
        dataPagamento: l.dataPagamento,
        justificativaDivergencia: l.justificativaDivergencia,
      }),
    }));
    StorageService.saveLancamentosBatch(comStatus);
    showToast(`${novos.length} lançamentos salvos com sucesso!`);
  };

  const salvarExtratoTransacoes = (transacoes: ExtratoTransacao[]) => {
    StorageService.saveExtratoTransacoes(transacoes);
  };

  const excluirLancamento = (id: string, scope?: ScopeSerie) => {
    const l = lancamentos.find((item) => item.id === id);
    if (!l) return;

    if (l.serieId && !scope) {
      abrirScopeDialog(l, 'excluir');
      return;
    }

    openConfirm({
      titulo: 'Excluir lançamento',
      mensagem: `Tem certeza que deseja excluir o lançamento "${l.descricao}"?`,
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteLancamento(id, scope);
        showToast('Lançamento excluído com sucesso.');
      },
    });
  };

  const marcarComoRealizadoRapido = (
    id: string,
    valorRealizado?: number,
    dataPagamento: string = getDataHojeISO()
  ) => {
    const l = lancamentos.find((item) => item.id === id);
    if (!l) return;
    const valorEfetivo = valorRealizado !== undefined ? valorRealizado : l.valorOrcado;
    const status = calcularStatusLancamento({
      valorOrcado: l.valorOrcado,
      valorRealizado: valorEfetivo,
      dataVencimento: l.dataVencimento,
      dataPagamento,
    });
    StorageService.saveLancamento({
      ...l,
      valorRealizado: valorEfetivo,
      dataPagamento,
      status,
    });
    showToast(`Lançamento marcado como ${status}!`);
  };

  const duplicarLancamento = (l: Lancamento) => {
    const novo: Lancamento = {
      ...l,
      id: `lanc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      descricao: `${l.descricao} (Cópia)`,
      serieId: undefined,
      numeroParcela: undefined,
      totalParcelas: undefined,
      valorRealizado: undefined,
      dataPagamento: undefined,
      status: 'previsto',
      conciliado: false,
    };
    StorageService.saveLancamento(novo);
    showToast('Lançamento duplicado com sucesso!');
  };

  const cancelarLancamento = (id: string) => {
    const l = lancamentos.find((item) => item.id === id);
    if (!l) return;
    StorageService.saveLancamento({
      ...l,
      status: 'cancelado',
    });
    showToast('Lançamento cancelado.');
  };

  const salvarConta = (c: ContaBancaria) => {
    StorageService.saveConta(c);
    showToast('Conta bancária salva!');
  };

  const excluirConta = (id: string) => {
    const associados = lancamentos.filter((l) => l.contaBancariaId === id || l.contaDestinoId === id);
    if (associados.length > 0) {
      showToast(`Não é possível excluir esta conta pois existem ${associados.length} lançamentos vinculados a ela.`, 'erro');
      return;
    }
    openConfirm({
      titulo: 'Excluir conta bancária',
      mensagem: 'Tem certeza que deseja excluir esta conta?',
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteConta(id);
        showToast('Conta excluída com sucesso.');
      },
    });
  };

  const salvarCategoria = (c: Categoria) => {
    StorageService.saveCategoria(c);
    showToast('Categoria salva!');
  };

  const excluirCategoria = (id: string, categoriaDestinoId?: string) => {
    const cat = categorias.find((c) => c.id === id);
    if (!cat) return;
    const associados = lancamentos.filter((l) => l.categoriaId === id);

    if (associados.length > 0 && !categoriaDestinoId) {
      // Abre diálogo solicitando a categoria de destino conforme especificação
      openConfirm({
        titulo: 'Excluir Categoria com Lançamentos',
        mensagem: `A categoria "${cat.subcategoria}" possui ${associados.length} lançamentos vinculados. Para continuar, selecione para qual categoria eles devem ser transferidos:`,
        confirmTexto: 'Transferir e Excluir',
        perigo: true,
        selectCategoriaDestino: true,
        categoriaOrigemId: id,
        onConfirm: () => {},
        onConfirmComDestino: (destinoId) => {
          StorageService.deleteCategoria(id, destinoId);
          showToast(`Categoria excluída e lançamentos transferidos!`);
        },
      });
      return;
    }

    openConfirm({
      titulo: 'Excluir Categoria',
      mensagem: `Deseja excluir a categoria "${cat.subcategoria}"?`,
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteCategoria(id, categoriaDestinoId);
        showToast('Categoria excluída.');
      },
    });
  };

  const salvarCliente = (cli: Cliente, gerarRecorrencias: boolean = false) => {
    StorageService.saveCliente(cli);
    if (gerarRecorrencias && cli.status === 'ativo' && cli.valorMensal > 0) {
      // Encontra categoria padrão para receitas de cliente ou a primeira de receita
      const catReceita = categorias.find((c) => c.tipo === 'receita') || categorias[0];
      const primeiraConta = contas[0];
      if (primeiraConta && catReceita) {
        const diaVenc = Math.min(31, Math.max(1, cli.diaVencimento || 10));
        const dtInicio = cli.dataInicio || getDataHojeISO();
        const serieId = `serie_cli_${cli.id}_${Date.now()}`;
        const novosLancamentos: Lancamento[] = [];

        for (let i = 0; i < 12; i++) {
          const anoIni = parseInt(dtInicio.split('-')[0], 10);
          const mesIni = parseInt(dtInicio.split('-')[1], 10);
          const dtComp = new Date(anoIni, mesIni - 1 + i, 1);
          const y = dtComp.getFullYear();
          const m = String(dtComp.getMonth() + 1).padStart(2, '0');
          const dMax = new Date(y, dtComp.getMonth() + 1, 0).getDate();
          const diaFinal = Math.min(diaVenc, dMax);
          const dtVenc = `${y}-${m}-${String(diaFinal).padStart(2, '0')}`;

          novosLancamentos.push({
            id: `lanc_cli_${cli.id}_${i}_${Date.now()}`,
            tipo: 'receita',
            descricao: `Mensalidade ${cli.nomeRazaoSocial} (${cli.planoServico || 'Fee Mensal'})`,
            categoriaId: catReceita.id,
            subcategoria: catReceita.subcategoria,
            grupo: catReceita.grupo,
            clienteId: cli.id,
            contaBancariaId: primeiraConta.id,
            mesCompetencia: `${y}-${m}`,
            dataVencimento: dtVenc,
            valorOrcado: cli.valorMensal,
            formaPagamento: 'boleto',
            status: calcularStatusLancamento({
              valorOrcado: cli.valorMensal,
              dataVencimento: dtVenc,
            }),
            conciliado: false,
            tags: ['Fee Mensal', 'Contrato Ativo'],
            serieId,
            numeroParcela: i + 1,
            tipoRecorrencia: 'mensal',
          });
        }
        salvarLancamentosEmLote(novosLancamentos);
      }
    }
    showToast('Cliente salvo com sucesso!');
  };

  const excluirCliente = (id: string, cancelarFuturos: boolean = false) => {
    const cli = clientes.find((c) => c.id === id);
    if (!cli) return;

    openConfirm({
      titulo: 'Excluir cliente',
      mensagem: `Deseja excluir o cliente "${cli.nomeRazaoSocial}"?`,
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        if (cancelarFuturos) {
          const hoje = getDataHojeISO();
          const atualizados = lancamentos.map((l) => {
            if (l.clienteId === id && l.dataVencimento >= hoje && !l.valorRealizado) {
              return { ...l, status: 'cancelado' as const };
            }
            return l;
          });
          StorageService.saveLancamentosBatch(atualizados);
        }
        StorageService.deleteCliente(id);
        showToast('Cliente excluído com sucesso.');
      },
    });
  };

  const salvarFornecedor = (forn: Fornecedor, gerarRecorrencias: boolean = false) => {
    StorageService.saveFornecedor(forn);
    if (gerarRecorrencias && forn.status === 'ativo' && forn.valorMensalCombinado > 0) {
      const catEquipe =
        categorias.find((c) => c.grupo === 'Despesas – Equipe PJ') ||
        categorias.find((c) => c.tipo === 'despesa') ||
        categorias[0];
      const primeiraConta = contas[0];
      if (primeiraConta && catEquipe) {
        const diaVenc = Math.min(31, Math.max(1, forn.diaPagamento || 5));
        const dtInicio = getDataHojeISO();
        const serieId = `serie_forn_${forn.id}_${Date.now()}`;
        const novosLancamentos: Lancamento[] = [];

        for (let i = 0; i < 12; i++) {
          const anoIni = parseInt(dtInicio.split('-')[0], 10);
          const mesIni = parseInt(dtInicio.split('-')[1], 10);
          const dtComp = new Date(anoIni, mesIni - 1 + i, 1);
          const y = dtComp.getFullYear();
          const m = String(dtComp.getMonth() + 1).padStart(2, '0');
          const dMax = new Date(y, dtComp.getMonth() + 1, 0).getDate();
          const diaFinal = Math.min(diaVenc, dMax);
          const dtVenc = `${y}-${m}-${String(diaFinal).padStart(2, '0')}`;

          novosLancamentos.push({
            id: `lanc_forn_${forn.id}_${i}_${Date.now()}`,
            tipo: 'despesa',
            descricao: `Honorários ${forn.nome} (${forn.funcao || 'Prestador PJ'})`,
            categoriaId: catEquipe.id,
            subcategoria: catEquipe.subcategoria,
            grupo: catEquipe.grupo,
            fornecedorId: forn.id,
            contaBancariaId: primeiraConta.id,
            mesCompetencia: `${y}-${m}`,
            dataVencimento: dtVenc,
            valorOrcado: forn.valorMensalCombinado,
            formaPagamento: 'pix',
            status: calcularStatusLancamento({
              valorOrcado: forn.valorMensalCombinado,
              dataVencimento: dtVenc,
            }),
            conciliado: false,
            tags: ['Equipe PJ', 'Honorários'],
            serieId,
            numeroParcela: i + 1,
            tipoRecorrencia: 'mensal',
          });
        }
        salvarLancamentosEmLote(novosLancamentos);
      }
    }
    showToast('Prestador PJ salvo com sucesso!');
  };

  const excluirFornecedor = (id: string) => {
    const f = fornecedores.find((item) => item.id === id);
    if (!f) return;
    openConfirm({
      titulo: 'Excluir prestador PJ',
      mensagem: `Deseja excluir "${f.nome}"?`,
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteFornecedor(id);
        showToast('Prestador excluído.');
      },
    });
  };

  const salvarCartao = (c: CartaoCredito) => {
    StorageService.saveCartao(c);
    showToast('Cartão salvo com sucesso!');
  };

  const excluirCartao = (id: string) => {
    openConfirm({
      titulo: 'Excluir cartão de crédito',
      mensagem: 'Tem certeza que deseja excluir este cartão?',
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteCartao(id);
        showToast('Cartão excluído.');
      },
    });
  };

  const salvarReembolso = (r: ReembolsoSocio) => {
    StorageService.saveReembolso(r);
    showToast('Reembolso/Empréstimo salvo!');
  };

  const excluirReembolso = (id: string) => {
    openConfirm({
      titulo: 'Excluir registro de reembolso',
      mensagem: 'Deseja excluir este registro de investimento/reembolso?',
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteReembolso(id);
        showToast('Registro excluído.');
      },
    });
  };

  const salvarCenario = (c: CenarioSimulacao) => {
    StorageService.saveCenario(c);
    showToast('Cenário de simulação salvo!');
  };

  const excluirCenario = (id: string) => {
    openConfirm({
      titulo: 'Excluir cenário',
      mensagem: 'Deseja excluir este cenário de simulação?',
      confirmTexto: 'Excluir',
      perigo: true,
      onConfirm: () => {
        StorageService.deleteCenario(id);
        showToast('Cenário excluído.');
      },
    });
  };

  const salvarMeta = (meta: MetaOrcamento) => {
    StorageService.saveMeta(meta);
    showToast('Meta orçamentária salva!');
  };

  const salvarConfiguracoes = (c: ConfiguracoesGerais) => {
    StorageService.saveConfiguracoes(c);
    showToast('Configurações salvas!');
  };

  const carregarDadosFicticios = () => {
    StorageService.carregarDadosFicticios();
    showToast('Dados financeiros removidos. Aguarde a sincronização do Asaas.', 'info');
  };

  const resetAll = () => {
    StorageService.resetAll();
    showToast('Todos os dados foram resetados para o estado zerado inicial.', 'info');
  };

  const exportarBackupJSON = () => {
    const json = StorageService.exportarBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_agencia_financeiro_${getDataHojeISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exportado com sucesso!');
  };

  const importarBackupJSON = (jsonString: string): boolean => {
    const ok = StorageService.importarBackup(jsonString);
    if (ok) {
      setContas(StorageService.getContas());
      setCategorias(StorageService.getCategorias());
      setClientes(StorageService.getClientES());
      setFornecedores(StorageService.getFornecedores());
      setLancamentos(StorageService.getLancamentos());
      setCartoes(StorageService.getCartoes());
      setReembolsos(StorageService.getReembolsos());
      setCenarios(StorageService.getCenarios());
      setMetas(StorageService.getMetas());
      setRegrasExtrato(StorageService.getRegrasExtrato());
      setExtratoTransacoes(StorageService.getExtratoTransacoes());
      setConfiguracoes(StorageService.getConfiguracoes());
      showToast('Backup JSON restaurado com sucesso!');
    }
    return ok;
  };

  return (
    <AppContext.Provider
      value={{
        contas,
        categorias,
        clientes,
        fornecedores,
        lancamentos,
        cartoes,
        reembolsos,
        cenarios,
        metas,
        metasOrcamentarias: metas,
        salvarMeta,
        regrasExtrato,
        extratoTransacoes,
        configuracoes,

        tipoPeriodo,
        setTipoPeriodo,
        mesSelecionado,
        setMesSelecionado,
        trimestreSelecionado,
        setTrimestreSelecionado,
        anoSelecionado,
        setAnoSelecionado,
        intervaloPersonalizado,
        setIntervaloPersonalizado,

        regime,
        setRegime,

        intervaloPeriodoAtual,
        mesesDoPeriodoAtual,
        isLancamentoNoPeriodo,

        theme,
        toggleTheme,
        setTheme,

        activeTab,
        setActiveTab,

        toasts,
        showToast,
        removeToast,

        confirmDialog,
        openConfirm,
        closeConfirm,

        modalNovoLancamento,
        abrirModalNovoLancamento,
        fecharModalNovoLancamento,

        scopeDialog,
        abrirScopeDialog,
        fecharScopeDialog,
        executarAcaoSerie,

        salvarLancamento,
        salvarLancamentosEmLote,
        salvarExtratoTransacoes,
        excluirLancamento,
        marcarComoRealizadoRapido,
        duplicarLancamento,
        cancelarLancamento,

        salvarConta,
        excluirConta,

        salvarCategoria,
        excluirCategoria,

        salvarCliente,
        excluirCliente,

        salvarFornecedor,
        excluirFornecedor,

        salvarCartao,
        excluirCartao,

        salvarReembolso,
        excluirReembolso,

        salvarCenario,
        excluirCenario,

        salvarConfiguracoes,
        carregarDadosFicticios,
        resetAll,
        limparTodosOsDados: resetAll,
        exportarBackupJSON,
        importarBackupJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
