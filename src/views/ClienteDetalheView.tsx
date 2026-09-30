import React, { useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  FilePlus,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Building,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Receipt,
  FileText,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Client, Contract, ReceivableItem, TimelineEvent } from '../types';
import { clientTimelineSample } from '../mockData';
import { formatCurrency, formatCurrencyDetailed } from '../utils';

interface ClienteDetalheViewProps {
  client: Client;
  contracts: Contract[];
  receivables: ReceivableItem[];
  onBack: () => void;
  onOpenContract: (contract: Contract) => void;
  onOpenQuickCreate: (type: string) => void;
  onTriggerActionToast: (msg: string) => void;
  hideValues: boolean;
}

export const ClienteDetalheView: React.FC<ClienteDetalheViewProps> = ({
  client,
  contracts = [],
  receivables = [],
  onBack,
  onOpenContract,
  onOpenQuickCreate,
  onTriggerActionToast,
  hideValues,
}) => {
  const [activeTab, setActiveTab] = useState<
    'visao_geral' | 'historico' | 'linha_do_tempo' | 'contratos' | 'financeiro' | 'documentos' | 'contatos'
  >('visao_geral');

  const clientContracts = (contracts || []).filter((c) => c.clientId === client.id);
  const clientReceivables = (receivables || []).filter((r) => r.clientId === client.id);

  const tabs = [
    { id: 'visao_geral', label: 'Visão geral' },
    { id: 'historico', label: 'Histórico de Atividade' },
    { id: 'linha_do_tempo', label: 'Linha do tempo' },
    { id: 'contratos', label: `Contratos (${clientContracts.length})` },
    { id: 'financeiro', label: `Financeiro (${clientReceivables.length})` },
    { id: 'documentos', label: 'Documentos' },
    { id: 'contatos', label: 'Contatos' },
  ];

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 text-xs font-semibold text-[var(--color-texto-medio)] hover:text-[var(--color-texto-forte)] transition-colors"
      >
        <ArrowLeft className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
        <span>Voltar para todos os clientes</span>
      </button>

      {/* Main 360° Header Banner */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-[var(--color-borda)] p-6 shadow-sutil">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Client Identity */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-sutil shrink-0 ${
                client.avatarColor || 'bg-[var(--color-primaria)]'
              }`}
            >
              {client.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 flex-wrap">
                <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[22px] font-bold text-[var(--color-texto-forte)]">{client.name}</h1>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FD] text-[var(--color-primaria)]">
                  {client.segment}
                </span>
                {client.financialStatus === 'inadimplente' ? (
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-perigo-suave text-perigo border border-perigo flex items-center gap-1">
                    <AlertTriangle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                    Inadimplente ({formatCurrency(client.openBalance, hideValues)})
                  </span>
                ) : (
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sucesso-suave text-sucesso border border-sucesso flex items-center gap-1">
                    <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                    Em dia
                  </span>
                )}
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--color-texto-medio)] mt-2">
                <span>CNPJ: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)] font-medium">{client.document}</strong></span>
                <span>Contato: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)] font-medium">{client.contactName}</strong></span>
                <span>E-mail: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)] font-medium">{client.contactEmail}</strong></span>
                <span>WhatsApp: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)] font-medium">{client.contactPhone}</strong></span>
                <span>Responsável: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-primaria)] font-semibold">{client.responsible}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-[var(--color-borda)] lg:pl-6">
            <div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] font-medium">Receita Mensal (MRR)</div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-[var(--color-texto-forte)]">
                {formatCurrency(client.monthlyRevenue, hideValues)}
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[#12A66A] font-medium">1 contrato ativo</div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-wrap items-center gap-2">
              <button
                onClick={() => onTriggerActionToast(`Lembrete de cobrança disparado via WhatsApp para ${client.contactName}`)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-[#4A4BD8] text-white text-xs font-semibold shadow-sutil transition-colors"
              >
                <DollarSign className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Cobrar</span>
              </button>

              <button
                onClick={() => onOpenQuickCreate('contrato')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-controle)] border border-[var(--color-borda)] bg-superficie hover:bg-[var(--color-fundo-sutil)] text-xs font-semibold text-[var(--color-texto)] transition-colors"
              >
                <FilePlus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-texto-medio)]" />
                <span>Novo contrato</span>
              </button>

              <button
                onClick={() => onTriggerActionToast(`Conversa de suporte iniciada com ${client.contactName}`)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2 rounded-[var(--radius-controle)] border border-[var(--color-borda)] bg-superficie hover:bg-[var(--color-fundo-sutil)] text-[var(--color-texto-medio)] transition-colors"
                title="Enviar mensagem WhatsApp"
              >
                <MessageSquare className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1 border-t border-[var(--color-borda)] mt-6 pt-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-controle)] whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#EEF0FD] text-[var(--color-primaria)]'
                  : 'text-[var(--color-texto-medio)] hover:text-[var(--color-texto-forte)] hover:bg-[var(--color-fundo-sutil)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Visão Geral */}
      {activeTab === 'visao_geral' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Smart Summary, Main Contract, Pending Invoices */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark lg:col-span-2 space-y-6">
            {/* AI Smart Summary */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-gradient-to-r from-[#EEF0FD]/60 to-white p-5 rounded-[var(--radius-card)] border border-[var(--color-primaria)]/20 shadow-sutil">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 mb-2">
                <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[var(--color-primaria)]" />
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-[var(--color-primaria)] uppercase tracking-wider">
                  Resumo Inteligente do Cliente
                </h3>
              </div>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto)] leading-relaxed">
                A <strong>{client.name}</strong> é cliente desde {client.createdAt}, gerando uma receita média mensal de <strong>{formatCurrency(client.monthlyRevenue, hideValues)}</strong> com margem estimada de 68%. O contrato de gestão de tráfego encontra-se ativo com vigência até 31/12/2026. Há 1 cobrança de R$ 2.450 pendente há 3 dias com lembrete amigável enviado.
              </p>
            </div>

            {/* Contrato Principal Card */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between mb-3">
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Contrato Principal</h3>
                {clientContracts[0] && (
                  <button
                    onClick={() => onOpenContract(clientContracts[0])}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-primaria)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Ver detalhes</span>
                    <ExternalLink className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                  </button>
                )}
              </div>

              {clientContracts[0] ? (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-[var(--color-texto-forte)]">
                      {clientContracts[0].code} · {clientContracts[0].title}
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] mt-1">
                      Serviço: {clientContracts[0].service} · Vencimento todo dia {clientContracts[0].dueDay}
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 mt-2">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sucesso-suave text-sucesso border border-sucesso">
                        Contrato: Ativo
                      </span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primaria-suave text-primaria border border-primaria">
                        Asaas: Cobrança Recorrente Ativa
                      </span>
                    </div>
                  </div>

                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)]">
                      {formatCurrencyDetailed(clientContracts[0].value, hideValues)}/mês
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] mt-0.5">
                      Vigência até {clientContracts[0].endDate}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-center py-6 text-xs text-[var(--color-texto-medio)]">
                  Nenhum contrato ativo cadastrado para este cliente.
                </div>
              )}
            </div>

            {/* Cobranças Recentes / Pendências */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between mb-3">
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Cobranças e Pagamentos</h3>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)]">Integrado com Asaas</span>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-[var(--color-borda)]">
                {clientReceivables.map((rec) => (
                  <div key={rec.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">{rec.description}</div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] flex items-center gap-2 mt-0.5">
                        <span>Vencimento: {rec.dueDate}</span>
                        <span>· Forma: {rec.method.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-[var(--color-texto-forte)]">
                        {formatCurrencyDetailed(rec.amount, hideValues)}
                      </span>
                      {rec.status === 'recebida' ? (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sucesso-suave text-sucesso border border-sucesso">
                          Recebido
                        </span>
                      ) : (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-full text-[10px] font-semibold bg-perigo-suave text-perigo border border-perigo">
                          Vencida
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Serviços Ativos, Margem e Próximos Passos */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6">
            {/* Serviços Contratados */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
              <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)] mb-3">Serviços Ativos</h3>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2">
                {client.services.map((s, idx) => (
                  <div
                    key={idx}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)] flex items-center justify-between text-xs"
                  >
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-medium text-[var(--color-texto)]">{s}</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[#12A66A] font-semibold">Em execução</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rentabilidade Estimada */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
              <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)] mb-3">Rentabilidade Estimada</h3>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Faturamento Mensal</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">
                    {formatCurrencyDetailed(client.monthlyRevenue, hideValues)}
                  </span>
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Custos Operacionais</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[#D92D4E]">
                    {hideValues ? '••••' : 'R$ 2.300,00'}
                  </span>
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between pt-2 border-t border-[var(--color-borda)]">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-[var(--color-texto-forte)]">Margem de Contribuição</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-[#12A66A]">68% (~R$ 4.900)</span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
              <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)] mb-3">Ações Rápidas</h3>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs">
                <button
                  onClick={() => onTriggerActionToast('Link de assinatura de aditivo gerado')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left px-3 py-2 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] hover:bg-[#EEF0FD] hover:text-[var(--color-primaria)] text-[var(--color-texto)] transition-colors"
                >
                  + Aditivo contratual
                </button>
                <button
                  onClick={() => onTriggerActionToast('Link público Asaas de pagamento copiado para área de transferência')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left px-3 py-2 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] hover:bg-[#EEF0FD] hover:text-[var(--color-primaria)] text-[var(--color-texto)] transition-colors"
                >
                  🔗 Copiar Link de Cobrança Pix
                </button>
                <button
                  onClick={() => onTriggerActionToast('Pastas de fechamento contábil sincronizadas no Google Drive')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left px-3 py-2 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] hover:bg-[#EEF0FD] hover:text-[var(--color-primaria)] text-[var(--color-texto)] transition-colors"
                >
                  📁 Acessar Pasta no Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Histórico de Atividade */}
      {activeTab === 'historico' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-6 shadow-sutil space-y-6">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Histórico Completo de Interações e Eventos</h3>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] mt-0.5">
                Registro unificado de chamados, mensagens via WhatsApp, contratos assinados e pagamentos efetuados.
              </p>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
              <button
                onClick={() => onTriggerActionToast('Nova anotação de atividade aberta')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3.5 py-1.5 bg-[var(--color-primaria)] hover:bg-[#4A4BD8] text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil transition-colors flex items-center gap-1.5"
              >
                <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Nova Interação</span>
              </button>
            </div>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-[var(--color-borda)]">
            {/* Sample activity log items synthesized from real client contracts & receivables */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark py-4 flex items-start gap-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-full bg-sucesso-suave text-sucesso flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 text-xs">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Pagamento Confirmado (Asaas / Pix)</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-suave)]">02/08/2026 às 14:22</span>
                </div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[#475467] mt-1">
                  Recebimento automático da competência 07/2026 no valor de <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">{formatCurrencyDetailed(client.monthlyRevenue, hideValues)}</strong> via webhook Asaas.
                </p>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark py-4 flex items-start gap-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-full bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 text-xs">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Contrato ativo</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-suave)]">{client.createdAt}</span>
                </div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[#475467] mt-1">
                  Contrato principal de prestação de serviços assinado digitalmente por {client.contactName} ({client.contactEmail}). Sincronizado com o Asaas.
                </p>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark py-4 flex items-start gap-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-full bg-primaria-suave text-primaria flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 text-xs">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Interação WhatsApp / Suporte</span>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-suave)]">{client.lastActivity}</span>
                </div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[#475467] mt-1">
                  Alinhamento de pauta de tráfego pago e revisão de criativos para a campanha de conversão. Responsável: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto)]">{client.responsible}</strong>.
                </p>
              </div>
            </div>

            {clientContracts.map((ctr) => (
              <div key={ctr.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark py-4 flex items-start gap-4">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-full bg-primaria-suave text-primaria flex items-center justify-center shrink-0 mt-0.5">
                  <FilePlus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 text-xs">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Vínculo de Contrato ({ctr.code})</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-suave)]">Início em {ctr.startDate}</span>
                  </div>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[#475467] mt-1">
                    {ctr.title} ({ctr.service}) no valor de {formatCurrencyDetailed(ctr.value, hideValues)}/mês. Status atual: <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-primaria)] uppercase">{ctr.status}</span>.
                  </p>
                </div>
              </div>
            ))}

            {clientReceivables.map((rec) => (
              <div key={rec.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark py-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${rec.status === 'recebida' ? 'bg-sucesso-suave text-sucesso' : 'bg-perigo-suave text-perigo'}`}>
                  <DollarSign className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 text-xs">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">Cobrança Asaas ({rec.method.toUpperCase()})</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-suave)]">Vencimento: {rec.dueDate}</span>
                  </div>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[#475467] mt-1">
                    {rec.description} — <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">{formatCurrencyDetailed(rec.amount, hideValues)}</strong>. Status: <span className={`font-semibold uppercase ${rec.status === 'recebida' ? 'text-sucesso' : 'text-perigo'}`}>{rec.status}</span>.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Contratos */}
      {activeTab === 'contratos' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center">
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Contratos deste cliente</h3>
            <button
              onClick={() => onOpenQuickCreate('contrato')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3.5 py-1.5 bg-[var(--color-primaria)] text-white rounded-[var(--radius-controle)] text-xs font-semibold"
            >
              + Criar Contrato
            </button>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientContracts.map((ctr) => (
              <div
                key={ctr.id}
                onClick={() => onOpenContract(ctr)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] hover:border-[var(--color-primaria)] shadow-sutil transition-colors cursor-pointer"
              >
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-start">
                  <div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-[var(--color-primaria)]">{ctr.code}</span>
                    <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)] mt-0.5">{ctr.title}</h4>
                    <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] mt-1">{ctr.service}</p>
                  </div>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sucesso-suave text-sucesso border border-sucesso">
                    {ctr.status.toUpperCase()}
                  </span>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-4 pt-3 border-t border-[var(--color-borda)] flex items-center justify-between text-xs">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Valor Mensal:</span>
                  <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)]">
                    {formatCurrencyDetailed(ctr.value, hideValues)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Financeiro */}
      {activeTab === 'financeiro' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-5 shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center mb-4">
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Contas a Receber (Asaas)</h3>
            <button
              onClick={() => onOpenQuickCreate('cobranca')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 bg-[#12A66A] text-white rounded-[var(--radius-controle)] text-xs font-semibold"
            >
              + Nova Cobrança
            </button>
          </div>

          <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
            <thead className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[var(--color-fundo-sutil)] border-b border-[var(--color-borda)] text-[var(--color-texto-medio)]">
              <tr>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3">Descrição</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3">Vencimento</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3">Valor</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3">Método</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3">Status</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-[var(--color-borda)]">
              {clientReceivables.map((rec) => (
                <tr key={rec.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-[var(--color-fundo-sutil)]">
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3 font-medium text-[var(--color-texto-forte)]">{rec.description}</td>
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3">{rec.dueDate}</td>
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3 font-bold">{formatCurrencyDetailed(rec.amount, hideValues)}</td>
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3 uppercase text-[11px] font-semibold">{rec.method}</td>
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'recebida'
                          ? 'bg-sucesso-suave text-sucesso'
                          : 'bg-perigo-suave text-perigo'
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-3 text-right">
                    <button
                      onClick={() => onTriggerActionToast(`Link Pix de ${rec.description} gerado`)}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:underline"
                    >
                      Copiar Pix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5 & 6: Documentos & Contatos */}
      {(activeTab === 'documentos' || activeTab === 'contatos') && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-[var(--color-borda)] p-8 text-center text-xs text-[var(--color-texto-medio)] shadow-sutil">
          <FileText className="dark:bg-fundo-dark dark:text-texto-forte-dark w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-[var(--color-texto-forte)]">
            {activeTab === 'documentos'
              ? 'Todos os contratos assinados estão disponíveis para consulta.'
              : 'Contatos autorizados para aprovação de propostas e recebimento de notas fiscais.'}
          </p>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-suave)] mt-1">
            Signatários: {client.contactName} ({client.contactEmail}).
          </p>
        </div>
      )}
    </div>
  );
};
