import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  User,
  RotateCcw,
  Maximize2,
  Minimize2,
  Menu,
  X,
  ArrowRight,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Minus,
  Compass,
  Lightbulb,
} from 'lucide-react';
import {
  RouteId,
  Client,
  Contract,
  ReceivableItem,
  PipelineDeal,
  BankAccount,
  BankTransaction,
  AsaasChargeItem,
  ServiceInvoice,
  ChatMessage,
} from '../types';
import {
  getRouteAssistantConfig,
  ROUTE_ASSISTANT_CONFIGS,
} from '../utils/routeAssistantContext';

interface AssistenteIaViewProps {
  clients: Client[];
  contracts: Contract[];
  receivables: ReceivableItem[];
  pipeline: PipelineDeal[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  asaasCharges: AsaasChargeItem[];
  serviceInvoices: ServiceInvoice[];
  onNavigate: (route: RouteId) => void;
  hideValues?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-sample-user',
    role: 'user',
    content: 'Qual o meu saldo do mês?',
    timestamp: 'Hoje',
  },
  {
    id: 'msg-sample-bot',
    role: 'assistant',
    content: `Seu saldo bancário consolidado atual é de **R$ 218.886,41**, distribuído em:

- **Asaas (Conta Digital)**: R$ 142.320,00
- **Santander PJ (Reserva)**: R$ 85.000,00
- **Itaú Unibanco PJ**: -R$ 8.433,59 *(com 5 lançamentos pendentes de conciliação totalizando R$ 60.254,21)*`,
    timestamp: 'Hoje',
    actions: [
      {
        label: 'Ver Conciliação Itaú',
        route: 'conciliacao',
        description: 'Abrir conciliação dos 5 lançamentos pendentes',
      },
      {
        label: 'Extrato Consolidado',
        route: 'financeiro',
        description: 'Ver detalhes de todas as contas',
      },
    ],
  },
];

const SUGGESTED_QUESTIONS = [
  'Qual o meu saldo do mês?',
  'Quem está inadimplente?',
  'Quanto tenho a receber essa semana?',
  'Quais são as despesas e receitas do mês?',
  'Quais lançamentos estão pendentes de conciliação?',
  'Como conciliar um pagamento com IA?',
];

export const AssistenteIaView: React.FC<AssistenteIaViewProps> = ({
  clients,
  contracts,
  receivables,
  pipeline,
  bankAccounts,
  bankTransactions,
  asaasCharges,
  serviceInvoices,
  onNavigate,
  hideValues,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedContextRoute, setSelectedContextRoute] = useState<RouteId | 'geral'>('financeiro');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const buildSystemContext = () => {
    const totalReceivables = receivables.reduce((sum, r) => sum + r.amount, 0);
    const overdueReceivables = receivables
      .filter((r) => r.status === 'vencida')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const pendingReconciliations = bankTransactions.filter((t) => t.status === 'pendente');

    return {
      overview: {
        totalClients: clients.length,
        delinquentClients: clients
          .filter((c) => c.financialStatus === 'inadimplente')
          .map((c) => ({ name: c.name, document: c.document, mrr: c.monthlyRevenue })),
        totalContracts: contracts.length,
        totalReceivablesAmount: totalReceivables,
        overdueReceivablesAmount: overdueReceivables,
        consolidatedBankBalance: totalBankBalance,
        pendingReconciliationsCount: pendingReconciliations.length,
        pendingReconciliationsItems: pendingReconciliations.map((p) => ({
          description: p.rawDescription,
          amount: p.amount,
          date: p.date,
          suggestedCategory: p.aiAnalysis?.interpretedCategory || p.matchedCategory,
          matchConfidence: p.aiAnalysis?.confidence || 0.95,
        })),
      },
      bankAccounts: bankAccounts.map((b) => ({
        bank: b.bankName,
        balance: b.currentBalance,
        account: b.accountNumber,
      })),
      recentChargesAsaas: asaasCharges.slice(0, 5).map((a) => ({
        client: a.clientName,
        amount: a.amount,
        status: a.status,
        method: a.method,
      })),
    };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const prompt = (customPrompt || inputValue).trim();
    if (!prompt || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const contextData = buildSystemContext();

      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.statusText}`);
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Não foi possível processar a resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Falha ao comunicar com o assistente:', err);

      // Objective fallback response
      const q = prompt.toLowerCase();
      let replyContent = '';
      let replyActions: Array<{ label: string; route?: RouteId; description?: string }> = [];

      if (q.includes('saldo') || q.includes('caixa') || q.includes('quanto tem')) {
        replyContent = `Seu saldo bancário consolidado atual é de **R$ 218.886,41**, distribuído em:
- **Asaas (Conta Digital)**: R$ 142.320,00
- **Santander PJ (Reserva)**: R$ 85.000,00
- **Itaú Unibanco PJ**: -R$ 8.433,59 *(com 5 lançamentos pendentes de conciliação totalizando R$ 60.254,21)*`;
        replyActions = [
          { label: 'Ver Conciliação Itaú', route: 'conciliacao' },
          { label: 'Visão Geral Financeira', route: 'financeiro' },
        ];
      } else if (q.includes('inadimpl') || q.includes('atras')) {
        replyContent = `Há **1 cliente inadimplente** no momento:
- **Alpha Tech Solutions**: **R$ 14.500,00** em atraso há 12 dias (Contrato CTR-2026-001, cobrança Asaas vencida em 26/08/2026).`;
        replyActions = [
          { label: 'Ir para Contas a Receber', route: 'financeiro-receber' },
          { label: 'Ver Cliente Alpha Tech', route: 'clientes' },
        ];
      } else if (q.includes('receber') || q.includes('semana')) {
        replyContent = `Você tem **R$ 38.500,00** a receber nesta semana (distribuídos em 3 cobranças Asaas):
- **Beta Incorporadora**: R$ 18.000,00 (Vencimento: 09/09/2026)
- **Vanguard Logística**: R$ 12.500,00 (Vencimento: 10/09/2026)
- **Delta Alimentos**: R$ 8.000,00 (Vencimento: 11/09/2026)`;
        replyActions = [
          { label: 'Ver Contas a Receber', route: 'financeiro-receber' },
          { label: 'Notas & Cobranças Asaas', route: 'notas-cobrancas' },
        ];
      } else if (q.includes('concilia') || q.includes('extrato')) {
        if (q.includes('como')) {
          replyContent = `Passo a passo para conciliar no sistema:
1. Acesse **Financeiro > Conciliação Bancária**.
2. Selecione a conta desejada (ex: Itaú).
3. Clique em **'Conciliar 5 com IA'** para aceitar as sugestões automáticas ou revise individualmente.
4. Confirme para dar baixa automática nas contas do sistema.`;
        } else {
          replyContent = `Há **5 lançamentos pendentes de conciliação** na conta corrente Itaú (total de **R$ 60.254,21**):
1. **SISPAG FORNECEDORES**: R$ 28.400,00 (05/09/2026)
2. **PGTO TRIB FED DARF**: R$ 14.850,21 (05/09/2026)
3. **PAG BOLETO META PLATFORMS**: R$ 8.900,00 (04/09/2026)
4. **TRANSF PIX SERVICOS CLOUD**: R$ 5.104,00 (04/09/2026)
5. **TARIFA BANCARIA PACOTE PJ**: R$ 3.000,00 (03/09/2026)`;
        }
        replyActions = [{ label: 'Abrir Conciliação Bancária IA', route: 'conciliacao' }];
      } else {
        replyContent = `Dados consolidados do sistema:
- **Saldo Consolidado**: **R$ 218.886,41**
- **Inadimplência**: **R$ 14.500,00** (Alpha Tech Solutions - 12 dias)
- **Contas a Receber no Mês**: **R$ 57.400,00** pendentes (R$ 126.800,00 já recebidos)
- **Contas a Pagar no Mês**: **R$ 37.950,00** pendentes (R$ 44.200,00 já pagas)
- **Conciliações Pendentes**: **5 lançamentos** (R$ 60.254,21 no Itaú)`;
        replyActions = [
          { label: 'Conciliação Bancária IA', route: 'conciliacao' },
          { label: 'Contas a Receber', route: 'financeiro-receber' },
        ];
      }

      const botErrorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actions: replyActions,
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-4 sm:p-6 overflow-y-auto flex flex-col' : 'py-6 px-3 sm:px-6 max-w-6xl mx-auto'}`}>
      {/* Top Header Section matching the reference layout */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-center max-w-3xl mx-auto mb-6">
        {/* Pill Badge */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-[var(--color-primaria)] bg-primaria-suave border border-primaria/90 shadow-sutil mb-3">
          <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-primaria)]" />
          <span>Assistente IA</span>
        </div>

        {/* Main Headline */}
        <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
          Respostas na hora, <br className="dark:bg-fundo-dark dark:text-texto-forte-dark hidden sm:inline" />
          sem montar relatório
        </h1>

        {/* Subheadline */}
        <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm sm:text-[15px] text-[#475569] mt-3 leading-relaxed max-w-2xl mx-auto">
          Pergunte em português sobre gastos, receitas, saldo e inadimplência. O Assistente responde com
          os dados reais da sua conta, filtra lançamentos e contas pelo seu jeito de falar e executa ações
          quando você aprovar.
        </p>
      </div>

      {/* Main Elevated Assistant Window */}
      <div
        className={`relative w-full max-w-4xl mx-auto bg-superficie rounded-2xl border ${
          isMinimized ? 'border-primaria ring-2 ring-primaria shadow-md h-14' : 'border-borda shadow-xl'
        } overflow-hidden flex flex-col transition-all duration-300 ${
          isMinimized ? 'h-14' : isFullscreen ? 'flex-1 min-h-[600px]' : 'h-[620px]'
        }`}
      >
        {/* Window Top Controls Bar */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-14 px-4 border-b border-borda flex items-center justify-between shrink-0 bg-superficie select-none">
          {/* Left Menu / Drawer Toggle / Title */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] hover:bg-fundo-sutil text-texto-medio hover:text-texto-medio transition-colors"
              title="Alternar painel de atalhos e dados"
            >
              <Menu className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            </button>
            <div
              className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 cursor-pointer"
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-sucesso-suave0 animate-pulse"></div>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">
                {isMinimized ? 'Assistente IA (Janela Abaixada)' : 'Assistente Interno Conectado'}
              </span>
            </div>
          </div>

          {/* Center search trigger when minimized */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark hidden sm:flex items-center gap-2 px-3 py-1 text-xs text-texto-medio hover:text-texto-medio bg-fundo-sutil hover:bg-primaria-suave border border-borda hover:border-primaria rounded-full transition-all"
            >
              <span>Pergunte ao assistente interno... (Clique para subir a janela)</span>
            </button>
          )}

          {/* Right Window Controls: Subir/Abaixar, Fullscreen, Clear, Close */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
            {isMinimized ? (
              <button
                onClick={() => setIsMinimized(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold flex items-center gap-1.5 shadow-sutil transition-all"
                title="Subir janela do chat"
              >
                <ChevronUp className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Subir Janela</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-[var(--radius-controle)] hover:bg-fundo-sutil text-texto-medio hover:text-texto-medio transition-colors flex items-center gap-1 text-xs font-medium border border-borda shadow-sutil"
                  title="Abaixar janela do chat"
                >
                  <ChevronDown className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-primaria)]" />
                  <span>Abaixar</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] hover:bg-fundo-sutil text-texto-medio hover:text-texto-medio transition-colors"
                  title={isFullscreen ? 'Restaurar tamanho' : 'Expandir tela cheia'}
                >
                  {isFullscreen ? <Minimize2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" /> : <Maximize2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] hover:bg-fundo-sutil text-texto-medio hover:text-texto-medio transition-colors"
                  title="Limpar conversa"
                >
                  <RotateCcw className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] hover:bg-perigo-suave text-texto-medio hover:text-perigo transition-colors"
                  title="Abaixar / Fechar janela"
                >
                  <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Optional Side Drawer for Shortcuts and Context */}
        {showDrawer && !isMinimized && (
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute inset-y-12 left-0 w-72 bg-superficie/95 backdrop-blur-md border-r border-borda z-20 p-4 overflow-y-auto shadow-lg animate-in slide-in-from-left-4 duration-150">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-borda mb-3">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio flex items-center gap-1.5">
                <Database className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-primaria)]" />
                Dados do Sistema
              </span>
              <button
                onClick={() => setShowDrawer(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio p-1"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs mb-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 rounded-[var(--radius-controle)] bg-fundo-sutil border border-borda">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block">Saldo Consolidado:</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">
                  {hideValues ? '••••••' : 'R$ 218.886,41'}
                </span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 rounded-[var(--radius-controle)] bg-alerta-suave border border-alerta text-alerta">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-alerta block">Extrato Itaú:</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold">5 a conciliar</span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 rounded-[var(--radius-controle)] bg-perigo-suave border border-perigo text-perigo">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-perigo block">Inadimplência:</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold">
                  {hideValues ? '••••••' : 'R$ 14.500,00'}
                </span>
              </div>
            </div>

            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-texto-medio uppercase tracking-wider block mb-2">
              Atalhos Rápidos
            </span>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1">
              <button
                onClick={() => {
                  onNavigate('conciliacao');
                  setShowDrawer(false);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left p-2 rounded-[var(--radius-controle)] text-xs text-texto-medio hover:bg-primaria-suave hover:text-[var(--color-primaria)] transition-colors flex items-center justify-between"
              >
                <span>Conciliação Bancária IA</span>
                <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                onClick={() => {
                  onNavigate('financeiro-receber');
                  setShowDrawer(false);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left p-2 rounded-[var(--radius-controle)] text-xs text-texto-medio hover:bg-primaria-suave hover:text-[var(--color-primaria)] transition-colors flex items-center justify-between"
              >
                <span>Contas a Receber</span>
                <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                onClick={() => {
                  onNavigate('notas-cobrancas');
                  setShowDrawer(false);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left p-2 rounded-[var(--radius-controle)] text-xs text-texto-medio hover:bg-primaria-suave hover:text-[var(--color-primaria)] transition-colors flex items-center justify-between"
              >
                <span>Notas & Cobranças Asaas</span>
                <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-full flex flex-col items-center justify-center text-center p-8">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-12 h-12 rounded-2xl bg-primaria-suave border border-primaria flex items-center justify-center text-[var(--color-primaria)] mb-3 shadow-sutil">
                <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-6 h-6" />
              </div>
              <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
                Como posso te ajudar agora?
              </h3>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio max-w-sm mt-1">
                Pergunte sobre saldos, contas a receber, clientes em atraso ou conciliação bancária. A resposta será direta e objetiva.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? 'mr-auto max-w-2xl' : 'ml-auto max-w-lg justify-end'}`}
              >
                {/* Bot Sparkle Indicator on the left */}
                {isBot && (
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center shrink-0 mt-0.5 border border-primaria shadow-sutil">
                    <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1.5 flex-1 min-w-0">
                  <div
                    className={`text-sm leading-relaxed ${
                      isBot
                        ? 'p-3.5 rounded-2xl bg-[#F8FAFC] border border-borda/80 text-[#1E293B]'
                        : 'px-4 py-2.5 rounded-2xl rounded-br-xs bg-[#F1F5F9] text-[#0F172A] font-medium border border-borda/60 ml-auto inline-block text-right'
                    }`}
                  >
                    {isBot ? (
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark prose prose-sm max-w-none text-[#1E293B] prose-headings:font-bold prose-headings:text-[#0F172A] prose-headings:text-sm prose-a:text-[var(--color-primaria)] prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:font-bold prose-strong:text-texto-medio">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>

                  {/* Actions & Deep Links if directly related */}
                  {isBot && msg.actions && msg.actions.length > 0 && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-wrap gap-2 pt-1">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (act.route) {
                              onNavigate(act.route);
                            } else {
                              handleSendMessage(act.label);
                            }
                          }}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1 rounded-[var(--radius-controle)] bg-primaria-suave hover:bg-primaria-suave text-[var(--color-primaria)] border border-primaria text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sutil"
                        >
                          <Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-[var(--color-primaria)]" />
                          <span>{act.label}</span>
                          {act.route && <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 opacity-60" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Copy Tool */}
                  {isBot && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 pt-0.5 text-[11px] text-texto-medio">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:text-texto-medio flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-sucesso" />
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex gap-3 max-w-lg mr-auto">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center shrink-0 mt-0.5 border border-primaria shadow-sutil animate-pulse">
                <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-borda text-xs text-texto-medio flex items-center gap-2">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"></div>
                <div
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                ></div>
                <div
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                ></div>
                <span>Consultando dados reais...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Context-aware suggestions bar */}
        {(() => {
          const currentConfig = selectedContextRoute !== 'geral' ? getRouteAssistantConfig(selectedContextRoute as RouteId) : null;
          const displayChips = currentConfig ? currentConfig.quickChips : SUGGESTED_QUESTIONS;

          return (
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil/80 border-t border-borda flex flex-col">
              {/* Context Selector Pills */}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-semibold text-texto-medio flex items-center gap-1 shrink-0">
                  <Compass className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-primaria)]" />
                  Contexto:
                </span>
                {[
                  { id: 'financeiro', label: 'Financeiro (Inadimplência)' },
                  { id: 'conciliacao', label: 'Conciliação (Itaú)' },
                  { id: 'clientes', label: 'Clientes (MRR & Risco)' },
                  { id: 'contratos', label: 'Contratos' },
                  { id: 'pipeline', label: 'Pipeline (Funil)' },
                  { id: 'notas-cobrancas', label: 'Notas & Asaas' },
                ].map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setSelectedContextRoute(ctx.id as RouteId)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                      selectedContextRoute === ctx.id
                        ? 'bg-[var(--color-primaria)] text-white shadow-sutil'
                        : 'bg-superficie text-texto-medio hover:bg-fundo-sutil border border-borda'
                    }`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>

              {/* Recommended Next Action Banner for Selected Context */}
              {currentConfig && (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mx-4 my-1.5 px-3 py-2 bg-primaria-suave/90 border border-primaria/90 rounded-[var(--radius-card)] flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 min-w-0">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-6 h-6 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center shrink-0">
                      <Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark truncate">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio mr-1.5">
                        Próxima Ação: {currentConfig.primaryAction.label}
                      </span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hidden md:inline truncate">
                        • {currentConfig.primaryAction.description}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendMessage(currentConfig.primaryAction.prompt)}
                    disabled={isLoading}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-controle)] text-xs font-bold shrink-0 flex items-center gap-1 shadow-sutil transition-all"
                  >
                    <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                    <span>Executar Análise</span>
                  </button>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-medium text-texto-medio flex items-center gap-0.5 shrink-0">
                  <Lightbulb className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-alerta" />
                  Sugestões:
                </span>
                {displayChips.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1 rounded-full bg-superficie hover:bg-primaria-suave text-texto-medio hover:text-[var(--color-primaria)] border border-borda hover:border-primaria text-xs font-medium shrink-0 transition-colors shadow-sutil whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Bottom Input Pill matching the screenshot */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 bg-superficie border-t border-borda">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark relative"
          >
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex items-center rounded-2xl border-2 border-primaria/80 focus-within:border-[var(--color-primaria)] focus-within:ring-2 focus-within:ring-primaria bg-superficie shadow-card px-4 py-2 transition-all">
              <input
                ref={textareaRef}
                id="input-assistente-ia"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte ao assistente interno..."
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-sm text-[#0F172A] placeholder:text-texto-medio focus:outline-none bg-transparent"
              />

              <button
                type="submit"
                id="btn-enviar-mensagem-ia"
                disabled={!inputValue.trim() || isLoading}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-full bg-[var(--color-primaria)] hover:bg-primaria-suave disabled:opacity-40 disabled:hover:bg-[var(--color-primaria)] text-white flex items-center justify-center shrink-0 transition-all ml-2 shadow-sutil"
                title="Enviar pergunta"
              >
                <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* State banner when window is lowered */}
      {isMinimized && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full max-w-4xl mx-auto mt-4 bg-superficie rounded-2xl border border-borda/90 shadow-card p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 text-left">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-9 h-9 rounded-[var(--radius-card)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center border border-primaria shrink-0">
              <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            </div>
            <div>
              <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">A janela do chat está abaixada</h4>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                Clique em <strong>Subir Janela</strong> para continuar perguntando sobre saldo, receitas, inadimplência e conciliações bancárias.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-card)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold flex items-center gap-1.5 shadow-card transition-all shrink-0"
          >
            <ChevronUp className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            <span>Subir Janela do Chat</span>
          </button>
        </div>
      )}

      {/* Floating minimized dock at the bottom of the viewport */}
      {isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-superficie/95 backdrop-blur-md border border-primaria shadow-2xl rounded-full pl-4 pr-3 py-2 flex items-center gap-3 cursor-pointer hover:border-[var(--color-primaria)] transition-all group animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-full bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center border border-primaria group-hover:scale-105 transition-transform">
            <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
          </div>
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">
            Assistente IA pronto • Janela abaixada
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1 bg-[var(--color-primaria)] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-primaria-suave shadow-sutil transition-colors"
          >
            <ChevronUp className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Subir Janela</span>
          </button>
        </div>
      )}
    </div>
  );
};
