export type TipoLancamento = 'receita' | 'despesa' | 'transferencia';

export type StatusLancamento =
  | 'previsto'
  | 'vencido'
  | 'parcial'
  | 'realizado'
  | 'divergente'
  | 'cancelado';

export type FormaPagamento = 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'dinheiro' | 'outros';

export type TipoContaBancaria = 'corrente' | 'poupanca' | 'carteira' | 'gateway' | 'investimento' | 'caixa_fisico';

export type StatusCliente = 'ativo' | 'pausado' | 'encerrado' | 'cancelado';

export type StatusFornecedor = 'ativo' | 'inativo';

export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export type RegimeVisualizacao = 'caixa' | 'competencia';

export type TipoFiltroPeriodo = 'mes' | 'trimestre' | 'ano' | 'personalizado';

export interface IntervaloData {
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
}

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  tipo: TipoContaBancaria;
  saldoInicial: number; // em centavos
  dataSaldoInicial?: string; // YYYY-MM-DD
  cor?: string;
  corHex?: string;
  ativa: boolean;
  saldoRealBancoMensal?: Record<string, number>; // chave 'YYYY-MM' -> saldo real em centavos para conciliação
}

export interface Categoria {
  id: string;
  grupo: string; // nível 1 (ex: "Receitas", "Despesas – Equipe PJ", "Despesas Operacionais", "Cartão de Crédito")
  subcategoria: string; // nível 2 (ex: "Branding", "Tráfego Pago", etc.)
  tipo: 'receita' | 'despesa';
  cor?: string;
  ordem?: number;
  ativa?: boolean;
  nome?: string;
  grupoDRE?: string;
  subcategorias?: string[];
}

export interface Cliente {
  id: string;
  nomeRazaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf: string;
  contato?: string;
  contatoResponsavel?: string;
  email?: string;
  emailFinanceiro?: string;
  telefone: string;
  planoServico: string;
  valorMensal: number; // em centavos
  diaVencimento: number; // 1-31
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  indiceReajuste?: string;
  mesReajuste?: number; // 1-12
  percentualReajuste?: number;
  renovacaoAutomatica?: boolean;
  status: StatusCliente;
  observacoes?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial?: string;
  funcao?: string;
  cpfCnpj?: string;
  cnpjCpf?: string;
  chavePix: string;
  tipoChavePix?: TipoChavePix;
  banco: string;
  agencia?: string;
  conta?: string;
  email?: string;
  telefone?: string;
  valorMensalCombinado?: number; // em centavos
  valorPadrao?: number; // em centavos
  diaPagamento?: number; // 1-31
  diaPagamentoPadrao?: number; // 1-31
  tipoRemuneracao?: 'mensal' | 'projeto' | 'hora' | 'fixo_mensal' | 'por_hora' | 'por_projeto';
  status?: StatusFornecedor;
  ativo?: boolean;
  observacoes?: string;
}

export interface LancamentoComprovante {
  nome: string;
  tipo: string;
  base64: string;
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  categoriaId: string;
  subcategoria: string;
  grupo?: string;
  clienteId?: string;
  fornecedorId?: string;
  contaBancariaId: string;
  contaDestinoId?: string; // para transferência
  mesCompetencia: string; // YYYY-MM
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string; // YYYY-MM-DD
  valorOrcado: number; // em centavos
  valorRealizado?: number; // em centavos
  formaPagamento: FormaPagamento;
  status: StatusLancamento;
  justificativaDivergencia?: string;
  conciliado: boolean;
  observacoes?: string;
  tags: string[];
  comprovante?: LancamentoComprovante;
  nfRecebida?: boolean;
  // Campos de vínculos recorrentes e parcelados
  serieId?: string;
  numeroParcela?: number;
  totalParcelas?: number;
  tipoRecorrencia?: 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  // Cartão
  cartaoId?: string;
  cartaoCreditoId?: string;
  faturaId?: string; // ex: 'cartao123_2026-07'
  isSoftwareSubscription?: boolean;
  iofPercent?: number;
}

export interface CartaoCredito {
  id: string;
  nome: string;
  bandeira: string;
  limite?: number; // em centavos
  limiteTotal?: number; // em centavos
  diaFechamento: number; // 1-31
  diaVencimento: number; // 1-31
  contaPagamentoId?: string;
  ativa?: boolean;
}

export interface ParcelaReembolso {
  numero: number;
  data: string;
  valor: number; // em centavos
  lancamentoId?: string;
}

export interface DevolucaoPaga {
  id: string;
  data: string; // YYYY-MM-DD
  valor: number; // centavos
  contaBancariaId?: string;
  comprovante?: LancamentoComprovante;
}

export interface ReembolsoSocio {
  id: string;
  credor?: string; // nome do sócio/colaborador
  socioNome?: string;
  descricao: string;
  valorInvestido?: number; // centavos
  valor?: number; // centavos
  data: string; // YYYY-MM-DD
  dataLiquidacao?: string;
  tipo?: 'reembolso' | 'emprestimo_socio' | 'distribuicao_lucros';
  planoDevolucao?: {
    parcelas: number;
    valorParcela: number; // centavos
    dataInicio: string; // YYYY-MM-DD
  };
  devolucoesPagas?: DevolucaoPaga[];
  saldoReembolsar?: number; // centavos
  status: 'em_aberto' | 'quitado' | 'pendente' | 'pago';
  comprovanteNome?: string;
}

export type ReembolsoEmprestimo = ReembolsoSocio;

export interface ItemHipoteticoSimulador {
  id: string;
  tipo:
    | 'novo_cliente'
    | 'remover_cliente'
    | 'contratar_prestador'
    | 'desligar_prestador'
    | 'despesa_recorrente'
    | 'investimento_pontual'
    | 'compra_parcelada'
    | 'receita_planejada'
    | 'despesa_planejada';
  descricao: string;
  valorMensalCents: number;
  mesInicioRelativo: number; // 1 a N
  duracaoMeses?: number;
  clienteId?: string;
  fornecedorId?: string;
  categoriaId?: string;
  aplicado?: boolean;
  // Valores editados diretamente na grade anual, indexados por YYYY-MM.
  valoresMensaisCents?: Record<string, number>;
}

export interface CenarioSimulacao {
  id: string;
  nome: string;
  horizonte: 3 | 6 | 12 | 18 | 24;
  premissas: {
    crescimentoReceitaMensalPct: number;
    reajusteDespesasPct: number;
    inadimplenciaPct: number;
    impostoEstimadoPct: number;
    churnPct: number;
  };
  itensHipoteticos: ItemHipoteticoSimulador[];
  // Substituições da base Asaas para meses abertos à simulação. Chave: linha|YYYY-MM.
  ajustesMensaisCents?: Record<string, number>;
  createdAt: string;
}

export interface MetaOrcamento {
  id: string;
  categoriaId: string;
  subcategoria?: string;
  mes?: string; // YYYY-MM ou 'global'
  mesCompetencia?: string;
  tetoCents?: number;
  valorOrcado?: number;
}

export interface RegraExtrato {
  id: string;
  textoContem: string;
  padraoTexto?: string;
  categoriaId: string;
  subcategoria: string;
  tipo: 'receita' | 'despesa';
}

export interface DadosEmpresa {
  nome: string;
  razaoSocial?: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  logoBase64?: string;
}

export interface ConfiguracoesGerais {
  horizonteProjecao: number; // meses, padrão 24
  toleranciaDivergenciaPct: number; // padrão 5
  saldoMinimoSegurancaCents: number; // padrão 1000000 (R$ 10.000,00)
  impostoPadraoPct: number; // ex: 6% Simples
  dadosEmpresa: DadosEmpresa;
  tagsDisponiveis: string[];
}

export interface ExtratoTransacao {
  id: string;
  contaBancariaId: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  valorCents: number; // positivo se crédito, negativo se débito
  conciliado: boolean;
  lancamentoIdVinculado?: string;
  ignorado?: boolean;
  descricaoConciliada?: string;
  categoriaId?: string;
  categoriaNome?: string;
}

export type ScopeSerie = 'somente_esta' | 'esta_e_proximas' | 'todas';
