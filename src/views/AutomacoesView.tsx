import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, ArrowRight, Plus, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export const AutomacoesView: React.FC = () => {
  const [automations, setAutomations] = useState([
    {
      id: '1',
      title: 'Contrato assinado → Criar cobrança Asaas',
      trigger: 'Contrato aprovado internamente',
      condition: 'Valor mensal > R$ 0',
      action: 'Criar assinatura recorrente e enviar link Pix',
      active: true,
      executions: 48,
    },
    {
      id: '2',
      title: 'Pagamento confirmado → Emitir NFS-e',
      trigger: 'Webhook de baixa de pagamento no Asaas',
      condition: 'NFS-e ainda não emitida',
      action: 'Emitir nota fiscal na prefeitura e enviar ao cliente',
      active: true,
      executions: 142,
    },
    {
      id: '3',
      title: 'Cobrança vencida há 3 dias → Lembrete WhatsApp',
      trigger: 'Cobrança vencida sem liquidação',
      condition: 'Tentativas < 3',
      action: 'Disparar mensagem WhatsApp amigável com Pix Copia e Cola',
      active: true,
      executions: 29,
    },
    {
      id: '4',
      title: 'Término em 30 dias → Criar oportunidade de Renovação',
      trigger: 'Data atual = Término do contrato - 30 dias',
      condition: 'Status do contrato = Ativo',
      action: 'Criar deal no Pipeline e notificar o responsável',
      active: true,
      executions: 12,
    },
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
            <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[24px] font-bold text-[var(--color-texto-forte)]">Automações Visuais</h1>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#12A66A]">
              4 ativas em produção
            </span>
          </div>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[13px] text-[var(--color-texto-medio)] mt-0.5">
            Estrutura visual <strong>Gatilho → Condição → Ação</strong> para eliminar redigitação e retrabalho operacional.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] font-medium">Execuções no Mês</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-[var(--color-texto-forte)] mt-1">231</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[#12A66A] mt-0.5 font-medium">100% de sucesso</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] font-medium">Tempo Economizado Estimado</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-[var(--color-primaria)] mt-1">38 horas</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] mt-0.5">Em cobranças e notas</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-4 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-[var(--color-texto-medio)] font-medium">Falhas de Sincronização</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-[#12A66A] mt-1">0</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] mt-0.5">Webhooks saudáveis</div>
        </div>
      </div>

      {/* Automations List */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
        {automations.map((a) => (
          <div
            key={a.id}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 flex-1">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-controle)] bg-[#EEF0FD] text-[var(--color-primaria)] flex items-center justify-center font-bold text-xs">
                  <Zap className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </div>
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)]">{a.title}</h3>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)]">
                  ({a.executions} execuções)
                </span>
              </div>

              {/* Visual Trigger -> Condition -> Action */}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)] text-[var(--color-texto)]">
                  ⚡ <strong>Gatilho:</strong> {a.trigger}
                </span>
                <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-[var(--radius-controle)] bg-[var(--color-fundo-sutil)] border border-[var(--color-borda)] text-[var(--color-texto)]">
                  🔍 <strong>Condição:</strong> {a.condition}
                </span>
                <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-[var(--radius-controle)] bg-[#EEF0FD] border border-[var(--color-primaria)]/20 text-[var(--color-primaria)] font-semibold">
                  🚀 <strong>Ação:</strong> {a.action}
                </span>
              </div>
            </div>

            {/* Toggle */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
              <button
                onClick={() => toggleAutomation(a.id)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 text-xs font-semibold text-[var(--color-texto)]"
              >
                {a.active ? (
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso flex items-center gap-1">
                    <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" /> Ativo
                  </span>
                ) : (
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">Pausado</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
