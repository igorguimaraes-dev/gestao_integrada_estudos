import React, { useState } from 'react';
import {
  Columns3,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  MoreHorizontal,
  ChevronRight,
  User,
} from 'lucide-react';
import { PipelineDeal } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';

interface PipelineViewProps {
  deals: PipelineDeal[];
  onOpenQuickCreate: (type: string) => void;
  onUpdateDealStage: (dealId: string, newStage: PipelineDeal['stage']) => void;
  hideValues: boolean;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  deals = [],
  onOpenQuickCreate,
  onUpdateDealStage,
  hideValues,
}) => {
  const [dealList, setDealList] = useState<PipelineDeal[]>(deals || []);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const stages: { id: PipelineDeal['stage']; label: string; color: string }[] = [
    { id: 'novo_lead', label: 'Novo Lead', color: 'border-primaria' },
    { id: 'qualificacao', label: 'Qualificação', color: 'border-primaria' },
    { id: 'diagnostico', label: 'Diagnóstico', color: 'border-primaria' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'border-alerta' },
    { id: 'negociacao', label: 'Negociação', color: 'border-orange-400' },
    { id: 'ganho', label: 'Ganho', color: 'border-sucesso' },
  ];

  const totalPipelineValue = (dealList || []).reduce((acc, d) => acc + d.amount, 0);

  const handleDragStart = (id: string) => {
    setDraggedDealId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: PipelineDeal['stage']) => {
    if (!draggedDealId) return;
    setDealList((prev) =>
      prev.map((d) => (d.id === draggedDealId ? { ...d, stage: stageId } : d))
    );
    onUpdateDealStage(draggedDealId, stageId);
    setDraggedDealId(null);
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
            <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[24px] font-bold text-[var(--color-texto-forte)]">Pipeline Comercial</h1>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0FD] text-[var(--color-primaria)]">
              {dealList.length} oportunidades ativas
            </span>
          </div>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[13px] text-[var(--color-texto-medio)] mt-0.5">
            Acompanhe a jornada da oportunidade até a proposta aprovada e convertida em contrato recorrente.
          </p>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right hidden sm:block">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)]">Valor total no funil:</div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-[var(--color-texto-forte)]">
              {formatCurrency(totalPipelineValue, hideValues)}
            </div>
          </div>

          <button
            onClick={() => onOpenQuickCreate('proposta')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3.5 py-2 bg-[var(--color-primaria)] hover:bg-[#4A4BD8] text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil transition-colors"
          >
            <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            <span>Nova oportunidade</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[600px]">
        {stages.map((stage) => {
          const stageDeals = dealList.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark w-72 shrink-0 bg-[#F6F7FB] border border-[var(--color-borda)] rounded-[var(--radius-card)] p-3 flex flex-col justify-between"
            >
              {/* Column Header */}
              <div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-2 border-b border-[var(--color-borda)]">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-[var(--color-texto-forte)]">{stage.label}</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 rounded-full bg-superficie border border-[var(--color-borda)] flex items-center justify-center text-[10px] font-bold text-[var(--color-texto-medio)]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-semibold text-[var(--color-texto-medio)]">
                    {formatCurrency(stageTotal, hideValues)}
                  </span>
                </div>

                {/* Cards List */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3 mt-3">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-3.5 rounded-[var(--radius-card)] border border-[var(--color-borda)] hover:border-[var(--color-primaria)] shadow-sutil cursor-grab active:cursor-grabbing transition-all select-none group"
                    >
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start justify-between">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-semibold text-[var(--color-primaria)]">
                          {deal.service}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] font-bold text-[var(--color-texto-medio)] bg-[#F2F4F7] px-1.5 py-0.5 rounded">
                          {deal.probability}% prob.
                        </span>
                      </div>

                      <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-[var(--color-texto-forte)] mt-1 group-hover:text-[var(--color-primaria)] transition-colors">
                        {deal.clientName}
                      </h4>

                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-[var(--color-texto-medio)] mt-0.5">
                        Contato: {deal.contactName}
                      </div>

                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 pt-2.5 border-t border-[var(--color-borda)] flex items-center justify-between text-xs">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-[var(--color-texto-forte)]">
                          {formatCurrencyDetailed(deal.amount, hideValues)}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-[var(--color-texto-suave)]">
                          Há {deal.daysInStage}d na etapa
                        </span>
                      </div>

                      {/* Next Step badge */}
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2 text-[10px] text-[#475467] bg-[var(--color-fundo-sutil)] p-1.5 rounded flex items-center gap-1.5">
                        <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-[var(--color-primaria)]" />
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark truncate">{deal.nextActivity}</span>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-6 border-2 border-dashed border-[var(--color-borda)] rounded-[var(--radius-card)] text-center text-xs text-[var(--color-texto-suave)]">
                      Arraste um card para cá
                    </div>
                  )}
                </div>
              </div>

              {/* Add deal at bottom of column */}
              <button
                onClick={() => onOpenQuickCreate('proposta')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full mt-3 py-1.5 text-xs text-[var(--color-texto-medio)] hover:text-[var(--color-texto-forte)] hover:bg-superficie rounded-[var(--radius-controle)] transition-colors font-medium border border-transparent hover:border-[var(--color-borda)] flex items-center justify-center gap-1"
              >
                <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
