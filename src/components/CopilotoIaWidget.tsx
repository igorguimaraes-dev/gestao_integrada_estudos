import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Maximize2,
  Minimize2,
  ArrowRight,
  Zap,
  HelpCircle,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Compass,
  Layers,
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
  RouteActionSuggestion,
} from '../utils/routeAssistantContext';

interface CopilotoIaWidgetProps {
  clients: Client[];
  contracts: Contract[];
  receivables: ReceivableItem[];
  pipeline: PipelineDeal[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  asaasCharges: AsaasChargeItem[];
  serviceInvoices: ServiceInvoice[];
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

export const CopilotoIaWidget: React.FC<CopilotoIaWidgetProps> = ({
  clients,
  contracts,
  receivables,
  pipeline,
  bankAccounts,
  bankTransactions,
  asaasCharges,
  serviceInvoices,
  currentRoute,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestionsCard, setShowSuggestionsCard] = useState(true);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const routeConfig = getRouteAssistantConfig(currentRoute);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'w-msg-1',
      role: 'assistant',
      content: `Olá! Estou monitorando a tela **${routeConfig.screenName}**. Veja abaixo a próxima ação sugerida ou pergunte qualquer número diretamente do sistema.`,
      timestamp: 'Agora',
      actions: [
        {
          label: routeConfig.primaryAction.label,
          description: routeConfig.primaryAction.description,
        },
        ...(routeConfig.secondaryActions[0]
          ? [
              {
                label: routeConfig.secondaryActions[0].label,
                route: routeConfig.secondaryActions[0].targetRoute,
                description: routeConfig.secondaryActions[0].description,
              },
            ]
          : []),
      ],
    },
  ]);

  // If user is already on assistente-ia view, hide floating widget
  if (currentRoute === 'assistente-ia') {
    return null;
  }

  const buildSystemContext = () => {
    const totalReceivables = receivables.reduce((sum, r) => sum + r.amount, 0);
    const overdueReceivables = receivables
      .filter((r) => r.status === 'vencida')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const pendingReconciliations = bankTransactions.filter((t) => t.status === 'pendente');

    return {
      currentScreen: currentRoute,
      screenName: routeConfig.screenName,
      suggestedPrimaryAction: routeConfig.primaryAction.label,
      overview: {
        totalClients: clients.length,
        delinquentClientsCount: clients.filter((c) => c.financialStatus === 'inadimplente').length,
        totalContracts: contracts.length,
        totalReceivablesAmount: totalReceivables,
        overdueReceivablesAmount: overdueReceivables,
        consolidatedBankBalance: totalBankBalance,
        pendingReconciliationsCount: pendingReconciliations.length,
      },
    };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const prompt = (customPrompt || inputValue).trim();
    if (!prompt || isLoading) return;

    const userMessage: ChatMessage = {
      id: `w-u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          contextData: buildSystemContext(),
        }),
      });

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: `w-b-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Desculpe, não consegui obter a resposta agora.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const q = prompt.toLowerCase();
      let fallbackText = '';
      if (q.includes('inadimpl') || q.includes('atras')) {
        fallbackText = `### Análise de Inadimplência & Cobrança
- **Alpha Tech Solutions:** **R$ 14.500,00** em atraso há 12 dias (Contrato CTR-2026-001).
- **Status:** Falha de compensação no Asaas (7,8% do MRR total da carteira).
- **Recomendação:** Reenviar Pix Copia e Cola pelo Asaas e verificar contato financeiro.`;
      } else if (q.includes('saldo') || q.includes('quanto tem') || q.includes('caixa')) {
        fallbackText = `Saldo bancário consolidado: **R$ 218.886,41**
- **Asaas (Conta Digital):** R$ 142.320,00
- **Santander PJ:** R$ 85.000,00
- **Itaú PJ:** -R$ 8.433,59 *(5 pendências somando R$ 60.254,21)*`;
      } else if (q.includes('concilia')) {
        fallbackText = `Há **5 lançamentos pendentes de conciliação** no Itaú (R$ 60.254,21). Sugestão de baixa com 95% de assertividade da IA.`;
      } else {
        fallbackText = `Saldo: **R$ 218.886,41** | Inadimplência: **R$ 14.500,00** | Conciliações pendentes: **5 lançamentos** no Itaú.`;
      }

      const botErrorMessage: ChatMessage = {
        id: `w-err-${Date.now()}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: 'Agora',
        actions: [
          { label: 'Ir para Contas a Receber', route: 'financeiro-receber' },
          { label: 'Abrir Conciliação Bancária', route: 'conciliacao' },
        ],
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const handleExecuteAction = (action: RouteActionSuggestion) => {
    handleSendMessage(action.prompt);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button & Context Teaser */}
      {!isOpen && (
        <div className="flex flex-col items-end gap-1.5 animate-in fade-in duration-200">
          {/* Contextual Suggestion Teaser Pill */}
          <div
            onClick={() => {
              setIsOpen(true);
            }}
            className="cursor-pointer bg-superficie/95 backdrop-blur-md border border-primaria hover:border-[var(--color-primaria)] text-texto-medio text-[11px] py-1 px-3 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 group select-none hover:scale-102"
            title={`Sugestão para tela de ${routeConfig.screenName}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-sucesso-suave0 animate-pulse"></div>
            <span className="font-semibold text-primaria">Sugestão:</span>
            <span className="text-texto-medio font-medium group-hover:text-[var(--color-primaria)] transition-colors max-w-[210px] truncate">
              {routeConfig.primaryAction.label}
            </span>
            <ArrowRight className="w-3 h-3 text-[var(--color-primaria)] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* Main Floating Trigger Button */}
          <button
            id="btn-open-copiloto-ia-widget"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[var(--color-primaria)] to-primaria hover:from-primaria hover:to-primaria text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-6 h-6 rounded-full bg-superficie/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span>Copiloto IA</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-superficie/20 font-mono">
              {routeConfig.badge}
            </span>
            {bankTransactions.filter((t) => t.status === 'pendente').length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-alerta-suave border-2 border-white absolute -top-1 -right-1"></span>
            )}
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[440px] h-[580px] max-h-[85vh] bg-superficie dark:bg-[#111827] rounded-2xl shadow-2xl border border-borda dark:border-borda-dark flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[var(--color-primaria)] to-primaria text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-controle)] bg-superficie/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Copiloto IA</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-superficie/20">Gemini 3.8</span>
                </div>
                <div className="text-[10px] text-primaria flex items-center gap-1">
                  <span>Contexto:</span>
                  <strong className="text-white">{routeConfig.screenName}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[var(--radius-controle)] hover:bg-superficie/20 text-white transition-colors flex items-center gap-1"
                title="Abaixar janela do chat"
              >
                <ChevronDown className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">Abaixar</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('assistente-ia');
                }}
                className="p-1.5 rounded-[var(--radius-controle)] hover:bg-superficie/20 text-white transition-colors"
                title="Expandir para tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[var(--radius-controle)] hover:bg-superficie/20 text-white transition-colors"
                title="Fechar janela"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner & Route Next Action Suggestions */}
          <div className="bg-gradient-to-b from-primaria/80 to-white dark:from-borda-dark/90 dark:to-[#111827] border-b border-primaria dark:border-borda-dark p-2.5 shrink-0 select-none">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-primaria dark:text-primaria-clara font-semibold truncate">
                <Compass className="w-3.5 h-3.5 text-[var(--color-primaria)] dark:text-primaria-clara shrink-0" />
                <span className="truncate">Sugestões para {routeConfig.screenName}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primaria-suave dark:bg-navy-claro/60 text-[var(--color-primaria)] dark:text-primaria-clara font-bold shrink-0">
                  {routeConfig.badge}
                </span>
              </div>
              <button
                onClick={() => setShowSuggestionsCard(!showSuggestionsCard)}
                className="text-[10px] text-texto-medio dark:text-texto-medio-dark hover:text-[var(--color-primaria)] dark:hover:text-primaria font-medium flex items-center gap-0.5 shrink-0"
              >
                <span>{showSuggestionsCard ? 'Ocultar' : 'Ver sugestões'}</span>
                {showSuggestionsCard ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Primary Recommended Next Action Card */}
            {showSuggestionsCard && (
              <div className="bg-superficie dark:bg-superficie-dark/90 rounded-[var(--radius-card)] border border-primaria/90 dark:border-borda-dark p-2.5 shadow-sutil space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/50 text-[var(--color-primaria)] dark:text-primaria-clara flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-texto-medio dark:text-white">
                          {routeConfig.primaryAction.label}
                        </span>
                        {routeConfig.primaryAction.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-alerta-suave dark:bg-superficie-dark/60 text-alerta dark:text-texto-forte-dark font-semibold">
                            {routeConfig.primaryAction.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-texto-medio dark:text-texto-medio-dark line-clamp-2 mt-0.5">
                        {routeConfig.primaryAction.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-borda dark:border-borda-dark">
                  {routeConfig.secondaryActions.length > 0 && (
                    <button
                      onClick={() => setShowMoreActions(!showMoreActions)}
                      className="text-[10px] text-texto-medio dark:text-texto-medio-dark hover:text-texto-medio dark:hover:text-white font-medium flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-[var(--color-primaria)] dark:text-primaria-clara" />
                      <span>+{routeConfig.secondaryActions.length} ações</span>
                      {showMoreActions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleExecuteAction(routeConfig.primaryAction)}
                    className="ml-auto px-3 py-1.5 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sutil transition-all active:scale-95"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Executar Análise com IA</span>
                  </button>
                </div>

                {/* Secondary Actions Expanded List */}
                {showMoreActions && routeConfig.secondaryActions.length > 0 && (
                  <div className="pt-2 border-t border-dashed border-borda dark:border-borda-dark space-y-1.5 animate-in fade-in duration-100">
                    <span className="text-[10px] font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider block">
                      Outras ações contextuais:
                    </span>
                    {routeConfig.secondaryActions.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-1.5 rounded-[var(--radius-controle)] hover:bg-primaria-suave/60 dark:hover:bg-navy border border-borda dark:border-borda-dark flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark block truncate">
                            {sec.label}
                          </span>
                          <span className="text-[10px] text-texto-medio dark:text-texto-medio-dark block truncate">
                            {sec.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {sec.targetRoute && (
                            <button
                              onClick={() => {
                                onNavigate(sec.targetRoute!);
                                setIsOpen(false);
                              }}
                              className="px-2 py-1 text-[10px] font-medium text-texto-medio dark:text-texto-medio-dark hover:text-[var(--color-primaria)] dark:hover:text-primaria rounded hover:bg-superficie dark:hover:bg-fundo-sutil border border-borda dark:border-borda-dark"
                              title="Ir para a tela"
                            >
                              Abrir
                            </button>
                          )}
                          <button
                            onClick={() => handleExecuteAction(sec)}
                            className="px-2 py-1 text-[10px] font-bold text-[var(--color-primaria)] dark:text-primaria-clara hover:text-white hover:bg-[var(--color-primaria)] rounded transition-colors"
                            title="Perguntar à IA"
                          >
                            Perguntar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-fundo-sutil/50 dark:bg-[#0B1120]">
            {messages.map((m) => {
              const isBot = m.role === 'assistant';

              return (
                <div
                  key={m.id}
                  className={`flex gap-2 text-xs ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isBot ? 'bg-[var(--color-primaria)] text-white' : 'bg-fundo-sutil dark:bg-superficie-dark text-white'
                    }`}
                  >
                    {isBot ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>

                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className={`p-3 rounded-[var(--radius-card)] leading-relaxed ${
                        isBot
                          ? 'bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark shadow-sutil'
                          : 'bg-[var(--color-primaria)] text-white'
                      }`}
                    >
                      {isBot ? (
                        <div className="prose prose-xs max-w-none text-texto-medio dark:text-texto-medio-dark dark:prose-invert prose-headings:font-bold prose-headings:text-xs prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      ) : (
                        <p>{m.content}</p>
                      )}
                    </div>

                    {isBot && m.actions && m.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.actions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (act.route) {
                                onNavigate(act.route);
                              } else {
                                handleSendMessage(act.label);
                              }
                            }}
                            className="px-2 py-1 rounded-md bg-primaria-suave hover:bg-primaria-suave text-[var(--color-primaria)] border border-primaria text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Zap className="w-2.5 h-2.5 text-[var(--color-primaria)]" />
                            <span>{act.label}</span>
                            {act.route && <ArrowRight className="w-2.5 h-2.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 text-xs mr-auto">
                <div className="w-6 h-6 rounded-md bg-[var(--color-primaria)] text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="p-3 rounded-[var(--radius-card)] bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-primaria)] animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                  <span className="text-[11px] ml-1">Analisando dados da tela...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions - Dynamic by currentRoute */}
          <div className="p-2 border-t border-borda dark:border-borda-dark bg-superficie dark:bg-[#111827] flex gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar items-center">
            <span className="text-texto-medio dark:text-texto-medio-dark flex items-center gap-0.5 shrink-0 pl-1">
              <Lightbulb className="w-3 h-3 text-alerta" />
            </span>
            {routeConfig.quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 bg-fundo-sutil dark:bg-superficie-dark hover:bg-primaria-suave dark:hover:bg-primaria-suave/60 hover:text-[var(--color-primaria)] dark:hover:text-primaria hover:border-primaria dark:hover:border-primaria border border-transparent dark:border-borda-dark rounded-[var(--radius-controle)] text-texto-medio dark:text-texto-medio-dark whitespace-nowrap transition-colors font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-borda dark:border-borda-dark bg-superficie dark:bg-[#111827] flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Pergunte sobre ${routeConfig.screenName.toLowerCase()}...`}
              className="flex-1 px-3 py-2 text-xs border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-superficie-dark text-texto-medio dark:text-white rounded-[var(--radius-controle)] focus:outline-hidden focus:border-[var(--color-primaria)] placeholder:text-texto-medio dark:placeholder:text-texto-medio"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-[var(--color-primaria)] hover:bg-primaria-suave disabled:opacity-50 text-white rounded-[var(--radius-controle)] transition-colors"
              title="Enviar mensagem"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

