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
  ScopeSerie,
} from '../types';
import { CONFIG_PADRAO } from '../utils/constants';
import { mesclarPrestadoresImportados } from '../data/prestadoresImportados';
import { normalizarTextoLegivel } from '../../utils/textoLegivel';

export const DATABASE_STORAGE_KEYS = {
  CONTAS: 'gestao_fin_contas_v1',
  CATEGORIAS: 'gestao_fin_categorias_v1',
  CLIENTES: 'gestao_fin_clientes_v1',
  FORNECEDORES: 'gestao_fin_fornecedores_v1',
  LANCAMENTOS: 'gestao_fin_lancamentos_v1',
  CARTOES: 'gestao_fin_cartoes_v1',
  REEMBOLSOS: 'gestao_fin_reembolsos_v1',
  CENARIOS: 'gestao_fin_cenarios_v1',
  METAS: 'gestao_fin_metas_v1',
  REGRAS_EXTRATO: 'gestao_fin_regras_extrato_v1',
  EXTRATO_TRANSACOES: 'gestao_fin_extrato_transacoes_v1',
  CONFIGURACOES: 'gestao_fin_configuracoes_v1',
  THEME: 'gestao_fin_theme_v1',
  SEEDED: 'gestao_fin_seeded_v1',
  CLEAN: 'gestao_fin_clean_v1',
  DATA_MODE: 'gestao_fin_data_mode_v2',
} as const;

const KEYS = DATABASE_STORAGE_KEYS;

// Listeners para sincronização em tempo real entre abas e componentes
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Erro ao notificar listener:', e);
    }
  });
}

function normalizarDadosPersistidos<T>(valor: T): T {
  if (typeof valor === 'string') return normalizarTextoLegivel(valor) as T;
  if (Array.isArray(valor)) return valor.map(normalizarDadosPersistidos) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [chave, normalizarDadosPersistidos(item)]),
    ) as T;
  }
  return valor;
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const dados = JSON.parse(item) as T;
    const dadosNormalizados = normalizarDadosPersistidos(dados);
    const jsonNormalizado = JSON.stringify(dadosNormalizados);
    if (jsonNormalizado !== item) localStorage.setItem(key, jsonNormalizado);
    return dadosNormalizados;
  } catch (error) {
    console.error(`Erro ao carregar do storage [${key}]:`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
    scheduleDatabaseSync();
  } catch (error) {
    console.error(`Erro ao salvar no storage [${key}]:`, error);
  }
}

let databaseSyncTimer: ReturnType<typeof setTimeout> | undefined;
let databaseHydrated = false;

function scheduleDatabaseSync(): void {
  if (!databaseHydrated) return;
  if (databaseSyncTimer) clearTimeout(databaseSyncTimer);
  databaseSyncTimer = setTimeout(() => {
    StorageService.sincronizarComBanco().catch(() => {
      // O cache local continua disponível quando o servidor ou banco estiverem indisponíveis.
    });
  }, 500);
}

/**
 * Camada de Repositório Única (storage.ts)
 */
export const StorageService = {
  async hidratarDoBanco(): Promise<boolean> {
    try {
      const response = await fetch('/api/persistence/state');
      if (!response.ok) return false;
      const payload = await response.json();
      const estado = payload?.state;
      const estadoNormalizado = estado && typeof estado === 'object'
        ? normalizarDadosPersistidos(estado)
        : estado;
      const houveNormalizacao = JSON.stringify(estadoNormalizado) !== JSON.stringify(estado);

      if (estadoNormalizado && typeof estadoNormalizado === 'object') {
        Object.values(KEYS).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(estadoNormalizado, key)) {
            localStorage.setItem(key, JSON.stringify(estadoNormalizado[key]));
          }
        });
        notifyListeners();
      }

      databaseHydrated = true;
      const fornecedoresAtuais = this.getFornecedores();
      const fornecedoresComImportacao = mesclarPrestadoresImportados(fornecedoresAtuais);
      const houveImportacao = fornecedoresComImportacao.length !== fornecedoresAtuais.length;
      if (houveImportacao) setItem(KEYS.FORNECEDORES, fornecedoresComImportacao);
      if (!estado || houveImportacao || houveNormalizacao) await this.sincronizarComBanco();
      return true;
    } catch {
      return false;
    }
  },

  async sincronizarComBanco(): Promise<void> {
    const estado = Object.values(KEYS).reduce<Record<string, unknown>>((acc, key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          acc[key] = JSON.parse(value);
        } catch {
          // Ignora valores legados corrompidos sem impedir os demais dados.
        }
      }
      return acc;
    }, {});

    const response = await fetch('/api/persistence/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: estado }),
    });
    if (!response.ok) throw new Error('Não foi possível persistir os dados no banco.');
  },

  // === CONTAS BANCÁRIAS ===
  getContas(): ContaBancaria[] {
    return getItem<ContaBancaria[]>(KEYS.CONTAS, []);
  },
  saveConta(conta: ContaBancaria): ContaBancaria {
    const contas = this.getContas();
    const index = contas.findIndex((c) => c.id === conta.id);
    let updated: ContaBancaria[];
    if (index >= 0) {
      updated = [...contas];
      updated[index] = conta;
    } else {
      updated = [...contas, conta];
    }
    setItem(KEYS.CONTAS, updated);
    return conta;
  },
  deleteConta(id: string): void {
    const contas = this.getContas().filter((c) => c.id !== id);
    setItem(KEYS.CONTAS, contas);
  },

  // === CATEGORIAS (pré-carregadas por padrão, editáveis) ===
  getCategorias(): Categoria[] {
    return getItem<Categoria[]>(KEYS.CATEGORIAS, []);
  },
  saveCategoria(categoria: Categoria): Categoria {
    const cats = this.getCategorias();
    const index = cats.findIndex((c) => c.id === categoria.id);
    let updated: Categoria[];
    if (index >= 0) {
      updated = [...cats];
      updated[index] = categoria;
    } else {
      updated = [...cats, categoria];
    }
    setItem(KEYS.CATEGORIAS, updated);
    return categoria;
  },
  deleteCategoria(id: string, categoriaDestinoId?: string): void {
    const cats = this.getCategorias();
    const catRemovida = cats.find((c) => c.id === id);
    if (!catRemovida) return;

    // Se houver lançamentos associados a esta categoria e foi informada categoria de destino
    if (categoriaDestinoId) {
      const catDestino = cats.find((c) => c.id === categoriaDestinoId);
      if (catDestino) {
        const lancamentos = this.getLancamentos();
        const atualizados = lancamentos.map((l) => {
          if (l.categoriaId === id) {
            return {
              ...l,
              categoriaId: catDestino.id,
              subcategoria: catDestino.subcategoria,
              grupo: catDestino.grupo,
            };
          }
          return l;
        });
        setItem(KEYS.LANCAMENTOS, atualizados);
      }
    }

    const filtradas = cats.filter((c) => c.id !== id);
    setItem(KEYS.CATEGORIAS, filtradas);
  },
  resetCategoriasPadrao(): void {
    setItem(KEYS.CATEGORIAS, []);
  },

  // === CLIENTES ===
  getClientES(): Cliente[] {
    return getItem<Cliente[]>(KEYS.CLIENTES, []);
  },
  saveCliente(cliente: Cliente): Cliente {
    const clientes = this.getClientES();
    const index = clientes.findIndex((c) => c.id === cliente.id);
    let updated: Cliente[];
    if (index >= 0) {
      updated = [...clientes];
      updated[index] = cliente;
    } else {
      updated = [...clientes, cliente];
    }
    setItem(KEYS.CLIENTES, updated);
    return cliente;
  },
  deleteCliente(id: string): void {
    const clientes = this.getClientES().filter((c) => c.id !== id);
    setItem(KEYS.CLIENTES, clientes);
  },

  // === FORNECEDORES PJ ===
  getFornecedores(): Fornecedor[] {
    return getItem<Fornecedor[]>(KEYS.FORNECEDORES, []);
  },
  saveFornecedor(fornecedor: Fornecedor): Fornecedor {
    const fornecedores = this.getFornecedores();
    const index = fornecedores.findIndex((f) => f.id === fornecedor.id);
    let updated: Fornecedor[];
    if (index >= 0) {
      updated = [...fornecedores];
      updated[index] = fornecedor;
    } else {
      updated = [...fornecedores, fornecedor];
    }
    setItem(KEYS.FORNECEDORES, updated);
    return fornecedor;
  },
  deleteFornecedor(id: string): void {
    const fornecedores = this.getFornecedores().filter((f) => f.id !== id);
    setItem(KEYS.FORNECEDORES, fornecedores);
  },

  // === LANÇAMENTOS (Entidade Central) ===
  getLancamentos(): Lancamento[] {
    return getItem<Lancamento[]>(KEYS.LANCAMENTOS, []);
  },
  saveLancamento(lancamento: Lancamento): Lancamento {
    const lancamentos = this.getLancamentos();
    const index = lancamentos.findIndex((l) => l.id === lancamento.id);
    let updated: Lancamento[];
    if (index >= 0) {
      updated = [...lancamentos];
      updated[index] = lancamento;
    } else {
      updated = [...lancamentos, lancamento];
    }
    setItem(KEYS.LANCAMENTOS, updated);
    return lancamento;
  },
  saveLancamentosBatch(novosLancamentos: Lancamento[]): void {
    const lancamentos = this.getLancamentos();
    const idMap = new Map(novosLancamentos.map((l) => [l.id, l]));
    const atualizados = lancamentos.map((l) => (idMap.has(l.id) ? idMap.get(l.id)! : l));
    const toAdd = novosLancamentos.filter((l) => !lancamentos.some((existente) => existente.id === l.id));
    setItem(KEYS.LANCAMENTOS, [...atualizados, ...toAdd]);
  },
  deleteLancamento(id: string, scope?: ScopeSerie): void {
    const lancamentos = this.getLancamentos();
    const target = lancamentos.find((l) => l.id === id);
    if (!target) return;

    if (!target.serieId || !scope || scope === 'somente_esta') {
      const rest = lancamentos.filter((l) => l.id !== id);
      setItem(KEYS.LANCAMENTOS, rest);
      return;
    }

    if (scope === 'todas') {
      const rest = lancamentos.filter((l) => l.serieId !== target.serieId);
      setItem(KEYS.LANCAMENTOS, rest);
      return;
    }

    if (scope === 'esta_e_proximas') {
      const rest = lancamentos.filter((l) => {
        if (l.serieId !== target.serieId) return true;
        return (l.numeroParcela || 0) < (target.numeroParcela || 0);
      });
      setItem(KEYS.LANCAMENTOS, rest);
    }
  },
  updateLancamentoSerie(
    id: string,
    alteracoes: Partial<Lancamento>,
    scope: ScopeSerie
  ): void {
    const lancamentos = this.getLancamentos();
    const target = lancamentos.find((l) => l.id === id);
    if (!target) return;

    if (!target.serieId || scope === 'somente_esta') {
      this.saveLancamento({ ...target, ...alteracoes });
      return;
    }

    const atualizados = lancamentos.map((l) => {
      if (l.serieId !== target.serieId) return l;

      if (scope === 'todas') {
        return {
          ...l,
          ...alteracoes,
          id: l.id,
          numeroParcela: l.numeroParcela,
          dataVencimento: l.dataVencimento, // mantém data original
          mesCompetencia: l.mesCompetencia,
        };
      }

      if (scope === 'esta_e_proximas') {
        if ((l.numeroParcela || 0) >= (target.numeroParcela || 0)) {
          return {
            ...l,
            ...alteracoes,
            id: l.id,
            numeroParcela: l.numeroParcela,
            dataVencimento: l.dataVencimento,
            mesCompetencia: l.mesCompetencia,
          };
        }
      }

      return l;
    });

    setItem(KEYS.LANCAMENTOS, atualizados);
  },

  // === CARTÕES DE CRÉDITO ===
  getCartoes(): CartaoCredito[] {
    return getItem<CartaoCredito[]>(KEYS.CARTOES, []);
  },
  saveCartao(cartao: CartaoCredito): CartaoCredito {
    const cartoes = this.getCartoes();
    const index = cartoes.findIndex((c) => c.id === cartao.id);
    let updated: CartaoCredito[];
    if (index >= 0) {
      updated = [...cartoes];
      updated[index] = cartao;
    } else {
      updated = [...cartoes, cartao];
    }
    setItem(KEYS.CARTOES, updated);
    return cartao;
  },
  deleteCartao(id: string): void {
    const cartoes = this.getCartoes().filter((c) => c.id !== id);
    setItem(KEYS.CARTOES, cartoes);
  },

  // === REEMBOLSOS E EMPRÉSTIMOS DE SÓCIOS ===
  getReembolsos(): ReembolsoSocio[] {
    return getItem<ReembolsoSocio[]>(KEYS.REEMBOLSOS, []);
  },
  saveReembolso(reembolso: ReembolsoSocio): ReembolsoSocio {
    const reembolsos = this.getReembolsos();
    const index = reembolsos.findIndex((r) => r.id === reembolso.id);
    let updated: ReembolsoSocio[];
    if (index >= 0) {
      updated = [...reembolsos];
      updated[index] = reembolso;
    } else {
      updated = [...reembolsos, reembolso];
    }
    setItem(KEYS.REEMBOLSOS, updated);
    return reembolso;
  },
  deleteReembolso(id: string): void {
    const reembolsos = this.getReembolsos().filter((r) => r.id !== id);
    setItem(KEYS.REEMBOLSOS, reembolsos);
  },

  // === CENÁRIOS DE SIMULAÇÃO ===
  getCenarios(): CenarioSimulacao[] {
    return getItem<CenarioSimulacao[]>(KEYS.CENARIOS, []);
  },
  saveCenario(cenario: CenarioSimulacao): CenarioSimulacao {
    const cenarios = this.getCenarios();
    const index = cenarios.findIndex((c) => c.id === cenario.id);
    let updated: CenarioSimulacao[];
    if (index >= 0) {
      updated = [...cenarios];
      updated[index] = cenario;
    } else {
      updated = [...cenarios, cenario];
    }
    setItem(KEYS.CENARIOS, updated);
    return cenario;
  },
  deleteCenario(id: string): void {
    const cenarios = this.getCenarios().filter((c) => c.id !== id);
    setItem(KEYS.CENARIOS, cenarios);
  },

  // === METAS DE ORÇAMENTO ===
  getMetas(): MetaOrcamento[] {
    return getItem<MetaOrcamento[]>(KEYS.METAS, []);
  },
  saveMeta(meta: MetaOrcamento): MetaOrcamento {
    const metas = this.getMetas();
    const index = metas.findIndex((m) => m.id === meta.id);
    let updated: MetaOrcamento[];
    if (index >= 0) {
      updated = [...metas];
      updated[index] = meta;
    } else {
      updated = [...metas, meta];
    }
    setItem(KEYS.METAS, updated);
    return meta;
  },
  deleteMeta(id: string): void {
    const metas = this.getMetas().filter((m) => m.id !== id);
    setItem(KEYS.METAS, metas);
  },

  // === REGRAS DE CONCILIAÇÃO BANCÁRIA ===
  getRegrasExtrato(): RegraExtrato[] {
    return getItem<RegraExtrato[]>(KEYS.REGRAS_EXTRATO, []);
  },
  saveRegraExtrato(regra: RegraExtrato): RegraExtrato {
    const regras = this.getRegrasExtrato();
    const index = regras.findIndex((r) => r.id === regra.id);
    let updated: RegraExtrato[];
    if (index >= 0) {
      updated = [...regras];
      updated[index] = regra;
    } else {
      updated = [...regras, regra];
    }
    setItem(KEYS.REGRAS_EXTRATO, updated);
    return regra;
  },
  deleteRegraExtrato(id: string): void {
    const regras = this.getRegrasExtrato().filter((r) => r.id !== id);
    setItem(KEYS.REGRAS_EXTRATO, regras);
  },

  // === TRANSAÇÕES IMPORTADAS DE EXTRATO ===
  getExtratoTransacoes(): ExtratoTransacao[] {
    return getItem<ExtratoTransacao[]>(KEYS.EXTRATO_TRANSACOES, []);
  },
  saveExtratoTransacoes(transacoes: ExtratoTransacao[]): void {
    setItem(KEYS.EXTRATO_TRANSACOES, transacoes);
  },

  // === CONFIGURAÇÕES GERAIS ===
  getConfiguracoes(): ConfiguracoesGerais {
    return getItem<ConfiguracoesGerais>(KEYS.CONFIGURACOES, CONFIG_PADRAO);
  },
  saveConfiguracoes(config: ConfiguracoesGerais): ConfiguracoesGerais {
    setItem(KEYS.CONFIGURACOES, config);
    return config;
  },

  // === TEMA (CLARO / ESCURO) ===
  getTheme(): 'light' | 'dark' {
    return getItem<'light' | 'dark'>(KEYS.THEME, 'light');
  },
  saveTheme(theme: 'light' | 'dark'): void {
    setItem(KEYS.THEME, theme);
  },

  // === BACKUP JSON EXPORT & IMPORT ===
  exportarBackup(): string {
    const dados = {
      contas: this.getContas(),
      categorias: this.getCategorias(),
      clientes: this.getClientES(),
      fornecedores: this.getFornecedores(),
      lancamentos: this.getLancamentos(),
      cartoes: this.getCartoes(),
      reembolsos: this.getReembolsos(),
      cenarios: this.getCenarios(),
      metas: this.getMetas(),
      regrasExtrato: this.getRegrasExtrato(),
      extratoTransacoes: this.getExtratoTransacoes(),
      configuracoes: this.getConfiguracoes(),
      exportadoEm: new Date().toISOString(),
      versao: '1.0',
    };
    return JSON.stringify(dados, null, 2);
  },

  importarBackup(jsonString: string): boolean {
    try {
      const dados = JSON.parse(jsonString);
      if (dados.contas) setItem(KEYS.CONTAS, dados.contas);
      if (dados.categorias) setItem(KEYS.CATEGORIAS, dados.categorias);
      if (dados.clientes) setItem(KEYS.CLIENTES, dados.clientes);
      if (dados.fornecedores) setItem(KEYS.FORNECEDORES, dados.fornecedores);
      if (dados.lancamentos) setItem(KEYS.LANCAMENTOS, dados.lancamentos);
      if (dados.cartoes) setItem(KEYS.CARTOES, dados.cartoes);
      if (dados.reembolsos) setItem(KEYS.REEMBOLSOS, dados.reembolsos);
      if (dados.cenarios) setItem(KEYS.CENARIOS, dados.cenarios);
      if (dados.metas) setItem(KEYS.METAS, dados.metas);
      if (dados.regrasExtrato) setItem(KEYS.REGRAS_EXTRATO, dados.regrasExtrato);
      if (dados.extratoTransacoes) setItem(KEYS.EXTRATO_TRANSACOES, dados.extratoTransacoes);
      if (dados.configuracoes) setItem(KEYS.CONFIGURACOES, dados.configuracoes);
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Falha ao importar backup JSON:', e);
      return false;
    }
  },

  // Mantido por compatibilidade com telas legadas: nunca carrega dados fictícios.
  carregarDadosFicticios(): void {
    this.resetAll();
  },

  replaceAsaasSnapshot(snapshot: {
    conta: ContaBancaria;
    categoria?: Categoria;
    clientes: Cliente[];
    lancamentos: Lancamento[];
    extratoTransacoes: ExtratoTransacao[];
  }): void {
    // Mantém registros criados pelo usuário (por exemplo, itens de fatura PDF)
    // e substitui somente o espelho que veio da API do Asaas.
    const contasManuais = this.getContas().filter((conta) => conta.id !== snapshot.conta.id);
    const categoriasAtuais = this.getCategorias();
    const categoriasManuais = snapshot.categoria
      ? categoriasAtuais.filter((categoria) => categoria.id !== snapshot.categoria?.id)
      : categoriasAtuais;
    const lancamentosManuais = this.getLancamentos().filter((lancamento) => !lancamento.tags?.some((tag) => tag === 'asaas' || tag === 'asaas-importado'));
    const classificacoesAnteriores = new Map(this.getExtratoTransacoes().map((movimento) => [movimento.id, movimento]));
    const extratoPreservado = snapshot.extratoTransacoes.map((movimento) => {
      const anterior = classificacoesAnteriores.get(movimento.id) as (ExtratoTransacao & { descricaoConciliada?: string; categoriaId?: string; categoriaNome?: string }) | undefined;
      return anterior?.conciliado ? {
        ...movimento,
        conciliado: true,
        descricaoConciliada: anterior.descricaoConciliada,
        categoriaId: anterior.categoriaId,
        categoriaNome: anterior.categoriaNome,
      } : movimento;
    });

    setItem(KEYS.CONTAS, [snapshot.conta, ...contasManuais]);
    setItem(KEYS.CATEGORIAS, snapshot.categoria ? [snapshot.categoria, ...categoriasManuais] : categoriasManuais);
    setItem(KEYS.CLIENTES, snapshot.clientes);
    setItem(KEYS.LANCAMENTOS, [...snapshot.lancamentos, ...lancamentosManuais]);
    setItem(KEYS.FORNECEDORES, []);
    setItem(KEYS.CARTOES, []);
    setItem(KEYS.REEMBOLSOS, []);
    setItem(KEYS.CENARIOS, []);
    setItem(KEYS.METAS, []);
    setItem(KEYS.REGRAS_EXTRATO, []);
    setItem(KEYS.EXTRATO_TRANSACOES, extratoPreservado);
    localStorage.setItem(KEYS.DATA_MODE, 'asaas-production');
    localStorage.setItem(KEYS.CLEAN, 'true');
    notifyListeners();
  },

  // === RESET TOTAL DO APP ===
  resetAll(): void {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    setItem(KEYS.CATEGORIAS, []);
    setItem(KEYS.CONFIGURACOES, CONFIG_PADRAO);
    localStorage.setItem(KEYS.CLEAN, 'true');
    localStorage.setItem(KEYS.DATA_MODE, 'empty');
    notifyListeners();
  },
};

// Migração única: remove dados de demonstração e aguarda a primeira sincronização do Asaas.
try {
  if (!localStorage.getItem(KEYS.DATA_MODE)) {
    StorageService.resetAll();
    localStorage.setItem(KEYS.DATA_MODE, 'empty');
  }
} catch (e) {
  console.warn('Storage migration check error:', e);
}
