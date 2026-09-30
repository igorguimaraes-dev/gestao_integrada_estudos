export type RouteId =
  | 'dashboard'
  | 'acoes'
  | 'pipeline'
  | 'clientes'
  | 'cliente-detalhe'
  | 'inadimplentes'
  | 'contratos'
  | 'contrato-detalhe'
  | 'financeiro'
  | 'financeiro-lancamentos'
  | 'financeiro-orcado-realizado'
  | 'financeiro-fluxo-caixa'
  | 'financeiro-conciliacao'
  | 'financeiro-cartoes'
  | 'financeiro-simulador'
  | 'financeiro-clientes-contratos'
  | 'financeiro-equipe'
  | 'financeiro-reembolsos'
  | 'financeiro-relatorios'
  | 'financeiro-importacao'
  | 'financeiro-configuracoes'
  | 'financeiro-categorias'
  | 'financeiro-receber'
  | 'financeiro-pagar'
  | 'conciliacao'
  | 'assistente-ia'
  | 'notas-cobrancas'
  | 'relatorios'
  | 'automacoes'
  | 'integracoes'
  | 'integracao-detalhe'
  | 'configuracoes';

export interface Client {
  id: string;
  name: string;
  tradeName?: string;
  document: string; // CNPJ / CPF
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  responsible: string;
  services: string[];
  activeContractsCount: number;
  monthlyRevenue: number;
  financialStatus: 'em_dia' | 'inadimplente' | 'pendente';
  healthScore: 'saudavel' | 'atencao' | 'critico';
  lastActivity: string;
  city: string;
  state: string;
  segment: string;
  createdAt: string;
  openBalance: number;
  avatarColor?: string;
}

export interface Contract {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  title: string;
  service: string;
  value: number;
  billingCycle: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'unico';
  startDate: string;
  endDate: string;
  dueDay: number;
  status: 'rascunho' | 'aguardando_assinatura' | 'ativo' | 'a_renovar' | 'cancelado';
  progressStep: number; // 1: Criado, 2: Enviado, 3: Assinado, 4: Cobrança config, 5: Ativo, 6: Renovação
  asaasStatus: 'sincronizado' | 'pendente' | 'erro';
  responsible: string;
  reajusteIndex: string;
  lastInvoiceSent?: string;
}

export interface ReceivableItem {
  id: string;
  clientId: string;
  clientName: string;
  contractCode?: string;
  description: string;
  dueDate: string;
  amount: number;
  method: 'pix' | 'boleto' | 'cartao';
  status: 'recebida' | 'pendente' | 'vencida' | 'agendada' | 'cancelada';
  invoiceStatus: 'emitida' | 'pendente' | 'erro' | 'nao_aplicavel';
  sentNotification: boolean;
  provider: 'asaas' | 'manual';
  paidAt?: string;
}

export interface PayableItem {
  id: string;
  supplier: string;
  description: string;
  category: string;
  costCenter: string;
  dueDate: string;
  amount: number;
  status: 'pago' | 'pendente' | 'vencido' | 'agendado';
  responsible: string;
  recurrence: 'unica' | 'mensal' | 'anual';
  hasReceipt: boolean;
}

export interface ActionItem {
  id: string;
  priority: 'alta' | 'media' | 'urgente' | 'baixa';
  category: 'financeiro' | 'contratos' | 'comercial' | 'operacao' | 'integracoes';
  title: string;
  description: string;
  value?: number;
  dueDate: string;
  clientId?: string;
  clientName?: string;
  responsible: string;
  actionType: 'lembrete_cobranca' | 'assinar_contrato' | 'retorno_proposta' | 'pagar_conta' | 'renovacao' | 'sincronizacao' | 'reuniao' | 'geral' | 'pagamento';
  completed?: boolean;
}

export interface PipelineDeal {
  id: string;
  title: string;
  clientName: string;
  contactName: string;
  amount: number;
  service: string;
  responsible: string;
  stage: 'novo_lead' | 'qualificacao' | 'diagnostico' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';
  nextActivity: string;
  daysInStage: number;
  probability: number;
  origin: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'proposta' | 'contrato' | 'cobranca' | 'nota_fiscal' | 'tarefa' | 'contato';
  statusBadge?: string;
  responsible?: string;
  amount?: number;
}

export interface Integration {
  id: string;
  name: string;
  category: 'pagamentos' | 'assinatura' | 'bancos' | 'fiscal' | 'comunicacao' | 'produtividade' | 'arquivos' | 'contabilidade' | 'crm' | 'comercial';
  description: string;
  status: 'conectado' | 'atencao' | 'desconectado' | 'em_breve';
  lastSync?: string;
  logo: string;
  connectedAccount?: string;
  features: string[];
  syncEventsToday?: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface ServiceInvoice {
  id: string;
  number: string;
  rpsNumber?: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  amount: number;
  issueDate: string;
  competence: string;
  serviceDescription: string;
  municipalServiceCode: string;
  status: 'autorizada' | 'processando' | 'cancelada' | 'erro';
  city: string;
  issRate: number; // e.g. 2% ou 5%
  retentions: {
    iss: number;
    pis: number;
    cofins: number;
    csll: number;
    ir: number;
  };
  asaasInvoiceId?: string;
  sentByEmail: boolean;
  pdfUrl?: string;
  xmlUrl?: string;
}

export interface AsaasChargeItem {
  id: string;
  clientName: string;
  clientId?: string;
  amount: number;
  method: 'Pix' | 'Boleto' | 'Cartão';
  status: 'pago' | 'pendente' | 'vencido';
  statusDotColor: 'blue' | 'yellow' | 'green' | 'red';
  dueDate: string;
  invoiceGenerated: boolean;
  invoiceNumber?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  bankSlipCode?: string;
  asaasId: string;
  description: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  badgeColor?: string;
  agency: string;
  accountNumber: string;
  currentBalance: number;
  reconciledBalance: number;
  pendingReconciliationAmount: number;
  pendingReconciliationCount: number;
  lastSyncDate: string;
  lastImportedDate: string;
  provider: 'pluggy' | 'asaas' | 'ofx' | 'open_finance';
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  dayOfWeek?: string;
  rawDescription: string;
  amount: number; // Negativo para pagamentos/débitos, positivo para recebimentos
  type: 'pagamento' | 'recebimento';
  channel: 'sispag' | 'pix' | 'ted' | 'debito_automatico' | 'boleto' | 'tarifa' | 'outro';
  documentNumber?: string;
  counterpartyRaw?: string;
  cpfCnpjRaw?: string;
  status: 'pendente' | 'conciliado' | 'arquivado';

  // Leitura inteligente e categorização da IA
  aiAnalysis?: {
    confidence: number; // ex: 0.98 (98%)
    interpretedEntity: string;
    interpretedCategory: string;
    interpretedCostCenter: string;
    explanation: string;
    suggestedDocumentId?: string;
    suggestedDocumentType?: 'payable' | 'receivable' | 'novo';
    suggestedDocumentCode?: string;
    autoMatchRule?: string;
  };

  // Campos de conciliação / Lançamentos do Sistema
  matchedDescription: string;
  matchedCategory: string;
  matchedCategoryId?: string;
  matchedSupplierOrClient: string;
  matchedCostCenter: string;
  matchedDocumentId?: string;
  matchedType?: 'novo_lancamento' | 'transferencia' | 'buscar_lancamento';
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface AssistantActionSuggestion {
  label: string;
  route?: RouteId;
  description?: string;
  iconName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: AssistantActionSuggestion[];
  metricsSnippet?: {
    title: string;
    items: Array<{ label: string; value: string; tone?: 'positive' | 'warning' | 'negative' | 'neutral' }>;
  };
  sources?: string[];
}
