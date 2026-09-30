import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Building,
  User,
  GripVertical,
  MoveUp,
  MoveDown,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cashflowData } from '../mockData';
import { formatCurrency, formatCurrencyDetailed } from '../utils';
import { ActionItem, Client, Contract, ReceivableItem, RouteId } from '../types';
import { ClientMonthlyRevenueChart } from '../components/ClientMonthlyRevenueChart';
import { StorageService, subscribeToStorage } from '../financeiro/services/storage';

interface DashboardViewProps {
  hideValues: boolean;
  onNavigate: (route: RouteId) => void;
  onOpenQuickCreate?: (type: string) => void;
  onSelectClient?: (client: Client) => void;
  onSelectContract?: (contract: Contract) => void;
  clients?: Client[];
  contracts?: Contract[];
  receivables?: ReceivableItem[];
  actionItems?: ActionItem[];
  onTriggerAction?: (item: ActionItem) => void;
}

const DEFAULT_WIDGETS = [
  { id: 'kpis', title: 'Indicadores Principais (KPIs)' },
  { id: 'revenue_comparison', title: 'Receita Prevista vs. Realizada (Últimos 6 Meses)' },
  { id: 'client_revenue', title: 'Monthly Revenue dos Clientes' },
  { id: 'cashflow', title: 'Fluxo de Caixa & Receita Recorrente' },
  { id: 'attention', title: 'Atenção Necessária & Ações Pendentes' },
  { id: 'health', title: 'Saúde da Carteira & Clientes' },
];

const revenueComparison6Months = [
  { month: 'Abr', prevista: 210000, realizada: 198000 },
  { month: 'Mai', prevista: 225000, realizada: 220000 },
  { month: 'Jun', prevista: 240000, realizada: 238000 },
  { month: 'Jul', prevista: 250000, realizada: 255000 },
  { month: 'Ago', prevista: 260000, realizada: 252000 },
  { month: 'Set', prevista: 275000, realizada: 268940 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  hideValues,
  onNavigate,
  onOpenQuickCreate,
  onSelectClient,
  onSelectContract,
  clients = [],
  contracts = [],
  receivables = [],
  actionItems = [],
  onTriggerAction,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [, setAsaasDataRevision] = useState(0);

  useEffect(() => subscribeToStorage(() => setAsaasDataRevision((value) => value + 1)), []);

  const asaasContas = StorageService.getContas().filter((conta) => conta.id === 'asaas-saldo-producao');
  const asaasLancamentos = StorageService.getLancamentos().filter((lancamento) => lancamento.tags?.includes('asaas'));
  const mesAtual = new Date().toISOString().slice(0, 7);
  const saldoAsaas = asaasContas.reduce((total, conta) => total + conta.saldoInicial, 0) / 100;
  const aReceberAsaas = asaasLancamentos
    .filter((lancamento) => lancamento.mesCompetencia === mesAtual && !['realizado', 'cancelado'].includes(lancamento.status))
    .reduce((total, lancamento) => total + lancamento.valorOrcado, 0) / 100;
  const recebidoAsaas = asaasLancamentos
    .filter((lancamento) => lancamento.dataPagamento?.slice(0, 7) === mesAtual && lancamento.status === 'realizado')
    .reduce((total, lancamento) => total + (lancamento.valorRealizado || 0), 0) / 100;
  const possuiDadosAsaas = asaasContas.length > 0 || asaasLancamentos.length > 0;
  const receitaAsaasUltimos6Meses = Array.from({ length: 6 }, (_, index) => {
    const data = new Date();
    data.setMonth(data.getMonth() - (5 - index));
    const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    const cobrancasDoMes = asaasLancamentos.filter((lancamento) => lancamento.mesCompetencia === mes && lancamento.status !== 'cancelado');
    return {
      month: data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      prevista: cobrancasDoMes.reduce((total, lancamento) => total + lancamento.valorOrcado, 0) / 100,
      realizada: cobrancasDoMes.reduce((total, lancamento) => total + (lancamento.valorRealizado || 0), 0) / 100,
    };
  });

  // Widget order persistence
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_widget_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_WIDGETS.map((w) => w.id);
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('dashboard_widget_order', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...widgetOrder];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setWidgetOrder(updated);
    setDraggedIndex(null);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgetOrder.length) return;

    const updated = [...widgetOrder];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setWidgetOrder(updated);
  };

  const resetWidgetOrder = () => {
    setWidgetOrder(DEFAULT_WIDGETS.map((w) => w.id));
  };

  // Sparkline generator helper
  const renderSparkline = (points: number[], color = '#7C3AED') => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const width = 84;
    const height = 24;

    const pathData = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const urgentPendingActions = (actionItems || []).filter((a) => !a.completed).slice(0, 3);

  // Render individual widget blocks
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'kpis':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Saldo disponível */}
            <div
              onClick={() => onNavigate('financeiro')}
              className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card hover:border-borda-forte dark:hover:border-borda transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">Saldo disponível</span>
                <div className="p-1.5 bg-primaria-suave dark:bg-navy-claro/50 text-primaria dark:text-primaria-clara rounded-[var(--radius-controle)]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(possuiDadosAsaas ? saldoAsaas : 0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{possuiDadosAsaas ? 'Saldo disponível no Asaas' : 'Aguardando sincronização Asaas'}</span>
                  </div>
                </div>
                <div>{renderSparkline([160, 168, 172, 170, 179, 184], '#7C3AED')}</div>
              </div>
            </div>

            {/* 2. A receber no mês */}
            <div className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">A receber no mês</span>
                <div className="p-1.5 bg-primaria-suave dark:bg-navy-claro/50 text-primaria dark:text-primaria-clara rounded-[var(--radius-controle)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(possuiDadosAsaas ? aReceberAsaas : 0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{possuiDadosAsaas ? 'Cobranças pendentes no mês' : 'Aguardando sincronização Asaas'}</span>
                  </div>
                </div>
                <div>{renderSparkline([210, 220, 235, 240, 255, 268], '#7C3AED')}</div>
              </div>
            </div>

            {/* 3. Recebido no mês */}
            <div className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">Recebido no mês</span>
                <div className="p-1.5 bg-sucesso-suave dark:bg-superficie-dark/50 text-sucesso dark:text-texto-forte-dark rounded-[var(--radius-controle)]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(possuiDadosAsaas ? recebidoAsaas : 0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{possuiDadosAsaas ? 'Cobranças recebidas no mês' : 'Aguardando sincronização Asaas'}</span>
                  </div>
                </div>
                <div>{renderSparkline([150, 165, 178, 172, 190, 197], '#7C3AED')}</div>
              </div>
            </div>

            {/* 4. A pagar no mês */}
            <div
              className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">A pagar no mês</span>
                <div className="p-1.5 bg-perigo-suave dark:bg-superficie-dark/50 text-perigo dark:text-texto-forte-dark rounded-[var(--radius-controle)]">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-perigo dark:text-texto-forte-dark mt-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>↓ 3.2% custos fixos</span>
                  </div>
                </div>
                <div>{renderSparkline([105, 102, 100, 98, 97, 96], '#7C3AED')}</div>
              </div>
            </div>

            {/* 5. Resultado projetado */}
            <div
              onClick={() => onNavigate('financeiro')}
              className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card hover:border-borda-forte dark:hover:border-borda transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">Resultado projetado</span>
                <div className="p-1.5 bg-primaria-suave dark:bg-navy-claro/50 text-primaria dark:text-primaria-clara rounded-[var(--radius-controle)]">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>↑ 15.3% margem líquida</span>
                  </div>
                </div>
                <div>{renderSparkline([60, 68, 72, 79, 82, 88], '#7C3AED')}</div>
              </div>
            </div>

            {/* 6. Receita recorrente (MRR) */}
            <div
              onClick={() => onNavigate('contratos')}
              className="bg-superficie dark:bg-superficie-dark p-5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card hover:border-borda-forte dark:hover:border-borda transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">Receita recorrente (MRR)</span>
                <div className="p-1.5 bg-primaria-suave dark:bg-navy-claro/50 text-primaria dark:text-primaria-clara rounded-[var(--radius-controle)]">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
                    {formatCurrency(0, hideValues)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>↑ 4.9% este mês</span>
                  </div>
                </div>
                <div>{renderSparkline([138, 142, 145, 147, 150, 152], '#7C3AED')}</div>
              </div>
            </div>
          </div>
        );

      case 'revenue_comparison':
        return (
          <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-texto-medio dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primaria dark:text-primaria-clara" />
                  Receita Prevista vs. Realizada (Últimos 6 Meses)
                </h2>
                <p className="text-xs text-texto-medio dark:text-texto-medio-dark mt-0.5">
                  Comparativo de metas e valores faturados no período recente via Recharts.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#94A3B8]"></span>
                  <span className="text-texto-medio dark:text-texto-medio-dark">Prevista (Meta)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[var(--color-primaria)]"></span>
                  <span className="text-texto-medio dark:text-texto-medio-dark">Realizada</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={possuiDadosAsaas ? receitaAsaasUltimos6Meses : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), hideValues), '']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="prevista" name="Prevista" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="realizada" name="Realizada" fill="var(--color-primaria)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'client_revenue':
        return (
          <ClientMonthlyRevenueChart
            clients={clients}
            hideValues={hideValues}
            onNavigate={onNavigate}
            onSelectClient={onSelectClient}
          />
        );

      case 'cashflow':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fluxo de Caixa */}
            <div className="lg:col-span-2 bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-texto-medio dark:text-white">Fluxo de caixa</h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#12A66A]"></span>
                    <span className="text-texto-medio dark:text-texto-medio-dark font-medium">Entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#D92D4E]"></span>
                    <span className="text-texto-medio dark:text-texto-medio-dark font-medium">Saídas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-primaria"></span>
                    <span className="text-texto-medio dark:text-texto-medio-dark font-medium">Saldo acumulado</span>
                  </div>
                </div>
              </div>

              {/* SVG Cashflow Chart */}
              <div className="h-64 w-full relative pt-4">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[11px] text-texto-medio dark:text-texto-medio-dark">
                  <div className="border-b border-dashed border-borda dark:border-borda-dark flex items-center justify-between pb-1">
                    <span>600k</span>
                  </div>
                  <div className="border-b border-dashed border-borda dark:border-borda-dark flex items-center justify-between pb-1">
                    <span>450k</span>
                  </div>
                  <div className="border-b border-dashed border-borda dark:border-borda-dark flex items-center justify-between pb-1">
                    <span>300k</span>
                  </div>
                  <div className="border-b border-dashed border-borda dark:border-borda-dark flex items-center justify-between pb-1">
                    <span>150k</span>
                  </div>
                  <div className="border-b border-dashed border-borda dark:border-borda-dark flex items-center justify-between pb-1">
                    <span>0k</span>
                  </div>
                </div>

                <div className="relative h-full flex items-end justify-between pl-8 pr-4 pb-8 z-10">
                  <svg className="absolute inset-0 pl-8 pr-4 pb-8 w-full h-full overflow-visible pointer-events-none">
                    <polyline
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="2.5"
                      points={cashflowData
                        .map((d, i) => {
                          const xPercent = (i / (cashflowData.length - 1)) * 92 + 4;
                          const yPercent = 100 - (d.acumulado / 600000) * 100;
                          return `${xPercent}%,${yPercent}%`;
                        })
                        .join(' ')}
                    />
                  </svg>

                  {cashflowData.map((d, idx) => {
                    const maxVal = 600000;
                    const entHeight = (d.entradas / maxVal) * 100;
                    const saiHeight = (d.saidas / maxVal) * 100;
                    const isHover = hoveredMonth === idx;

                    return (
                      <div
                        key={d.month}
                        className="flex flex-col items-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(idx)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {isHover && (
                          <div className="absolute -top-16 bg-navy text-white text-[11px] px-3 py-1.5 rounded-[var(--radius-controle)] shadow-xl whitespace-nowrap z-30 pointer-events-none">
                            <div className="font-semibold">{d.month} / 2026</div>
                            <div className="text-sucesso">Entradas: {formatCurrency(d.entradas, hideValues)}</div>
                            <div className="text-perigo">Saídas: {formatCurrency(d.saidas, hideValues)}</div>
                            <div className="text-primaria">Acumulado: {formatCurrency(d.acumulado, hideValues)}</div>
                          </div>
                        )}

                        <div className="flex items-end gap-1.5 h-44">
                          <div
                            style={{ height: `${entHeight}%` }}
                            className="w-4 sm:w-5 bg-[#12A66A] rounded-t-xs transition-all duration-200 hover:brightness-110"
                          />
                          <div
                            style={{ height: `${saiHeight}%` }}
                            className="w-4 sm:w-5 bg-[#D92D4E] rounded-t-xs transition-all duration-200 hover:brightness-110"
                          />
                        </div>
                        <span className="text-xs font-medium text-texto-medio dark:text-texto-medio-dark mt-2.5">
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Receita Recorrente Breakdown Card */}
            <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-texto-medio dark:text-white mb-4">
                  Receita recorrente
                </h2>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-borda dark:border-borda-dark">
                    <span className="text-texto-medio dark:text-texto-medio-dark">MRR atual</span>
                    <span className="font-bold text-texto-medio dark:text-white text-sm">
                      {formatCurrency(152800, hideValues)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-texto-medio dark:text-texto-medio-dark">Novos contratos</span>
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark">
                      {formatCurrency(11400, hideValues)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-texto-medio dark:text-texto-medio-dark">Expansão</span>
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark">
                      {formatCurrency(6200, hideValues)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-texto-medio dark:text-texto-medio-dark">Redução</span>
                    <span className="font-semibold text-perigo dark:text-texto-forte-dark">
                      {hideValues ? '••••' : '- R$ 2.300'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-texto-medio dark:text-texto-medio-dark">Cancelamentos</span>
                    <span className="font-semibold text-perigo dark:text-texto-forte-dark">
                      {hideValues ? '••••' : '- R$ 4.800'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-fundo-sutil dark:bg-navy/60 border border-borda dark:border-borda-dark rounded-[var(--radius-card)] text-xs text-texto-medio dark:text-texto-medio-dark leading-relaxed">
                Crescimento líquido de{' '}
                <strong className="text-sucesso dark:text-texto-forte-dark font-semibold">
                  {hideValues ? '••••' : 'R$ 10.500'}
                </strong>{' '}
                no mês, puxado por expansão de contratos existentes.
              </div>
            </div>
          </div>
        );

      case 'attention':
        return (
          <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-texto-medio dark:text-white">
                  Atenção necessária
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-perigo-suave dark:bg-superficie-dark/60 text-perigo dark:text-texto-forte-dark border border-perigo dark:border-borda-dark">
                  {urgentPendingActions.length} pendências críticas
                </span>
              </div>
              <button
                onClick={() => onNavigate('acoes')}
                className="text-sm font-medium text-primaria dark:text-primaria-clara hover:text-primaria flex items-center gap-1"
              >
                <span>Ver Agenda & Calendário</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-[var(--radius-card)] border border-primaria dark:border-borda-dark bg-gradient-to-r from-primaria/70 to-primaria/70 dark:from-primaria-clara/40 dark:to-primaria-clara/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sutil">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-texto-medio dark:text-white flex items-center gap-2">
                      <span>Conciliação Bancária com IA</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-alerta-suave dark:bg-superficie-dark text-alerta dark:text-texto-forte-dark">
                        5 pagamentos lidos
                      </span>
                    </div>
                    <p className="text-xs text-texto-medio dark:text-texto-medio-dark mt-0.5">
                      R$ 60.254,21 importados do Itaú aguardando conciliação. A IA já identificou fornecedores e categorias com 98% de precisão.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    id="btn-dash-conciliar-ia"
                    onClick={() => onNavigate('conciliacao')}
                    className="px-3.5 py-1.5 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-controle)] text-xs font-bold shadow-sutil transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Conciliar com IA</span>
                  </button>
                </div>
              </div>

              {urgentPendingActions.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark hover:border-borda-forte dark:hover:border-borda transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-fundo-sutil/60 dark:bg-navy/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[var(--radius-controle)] bg-perigo-suave dark:bg-superficie-dark text-perigo dark:text-texto-forte-dark flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-texto-medio dark:text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.clientName && (
                          <span className="text-[11px] font-normal text-texto-medio dark:text-texto-medio-dark">
                            · {item.clientName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-texto-medio dark:text-texto-medio-dark mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onTriggerAction && onTriggerAction(item)}
                      className="px-3.5 py-1.5 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
                    >
                      Resolver agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-texto-medio dark:text-white">
                  Saúde da carteira
                </h2>
                <button
                  onClick={() => onNavigate('clientes')}
                  className="text-sm font-medium text-primaria dark:text-primaria-clara hover:text-primaria"
                >
                  Ver clientes
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-[var(--radius-controle)] bg-sucesso-suave dark:bg-superficie-dark/40 border border-sucesso dark:border-borda-dark">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sucesso-suave"></span>
                    <span className="font-semibold text-sucesso dark:text-texto-forte-dark">Saudáveis</span>
                  </div>
                  <span className="font-bold text-sucesso dark:text-texto-forte-dark">4 clientes (78% MRR)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius-controle)] bg-alerta-suave dark:bg-superficie-dark/40 border border-alerta dark:border-borda-dark">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-alerta-suave"></span>
                    <span className="font-semibold text-alerta dark:text-texto-forte-dark">Em atenção</span>
                  </div>
                  <span className="font-bold text-alerta dark:text-texto-forte-dark">1 cliente (14% MRR)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius-controle)] bg-perigo-suave dark:bg-superficie-dark/40 border border-perigo dark:border-borda-dark">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-perigo-suave"></span>
                    <span className="font-semibold text-perigo dark:text-texto-forte-dark">Críticos (inadimplência)</span>
                  </div>
                  <span className="font-bold text-perigo dark:text-texto-forte-dark">1 cliente (8% MRR)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-borda dark:border-borda-dark text-xs text-texto-medio dark:text-texto-medio-dark flex items-center justify-between">
              <span>Total da base ativa:</span>
              <strong className="text-texto-medio dark:text-white font-semibold">6 empresas parceiras</strong>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-texto-medio dark:text-white tracking-tight">
            Boa tarde, Marlon
          </h1>
          <p className="text-xs text-texto-medio dark:text-texto-medio-dark mt-1">
            Setembro de 2026 · comparado a agosto de 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-personalizar-dash"
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] text-sm font-medium text-texto-medio dark:text-texto-medio-dark shadow-card transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-texto-medio dark:text-texto-medio-dark" />
            <span>Personalizar dashboard</span>
          </button>
        </div>
      </div>

      {/* Reorderable Widgets Container */}
      <div className="space-y-6">
        {widgetOrder.map((widgetId, index) => {
          const widgetInfo = DEFAULT_WIDGETS.find((w) => w.id === widgetId);
          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative group transition-all rounded-2xl ${
                draggedIndex === index ? 'opacity-40 border-2 border-dashed border-primaria' : ''
              }`}
            >
              {/* Drag Handle & Reorder Toolbar on hover */}
              <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-1 bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-md rounded-[var(--radius-controle)] px-2 py-1 text-xs text-texto-medio dark:text-texto-medio-dark">
                <div className="cursor-grab active:cursor-grabbing flex items-center gap-1 font-medium pr-2 border-r border-borda dark:border-borda-dark">
                  <GripVertical className="w-4 h-4 text-texto-medio" />
                  <span className="text-[11px]">{widgetInfo?.title || widgetId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => moveWidget(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded disabled:opacity-30"
                  title="Mover para cima"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveWidget(index, 'down')}
                  disabled={index === widgetOrder.length - 1}
                  className="p-1 hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded disabled:opacity-30"
                  title="Mover para baixo"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {renderWidgetContent(widgetId)}
            </div>
          );
        })}
      </div>

      {/* Customization & Drag-and-Drop Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-superficie dark:bg-superficie-dark rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-borda dark:border-borda-dark space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-texto-medio dark:text-white">Personalizar & Reordenar Dashboard</h3>
                <p className="text-xs text-texto-medio dark:text-texto-medio-dark mt-0.5">
                  Arraste os blocos na tela ou use as setas para reordenar instantaneamente.
                </p>
              </div>
              <button
                type="button"
                onClick={resetWidgetOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primaria dark:text-primaria-clara hover:bg-primaria-suave dark:hover:bg-primaria-suave/50 rounded-[var(--radius-controle)] transition-colors border border-primaria dark:border-borda-dark"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar padrão</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {widgetOrder.map((widgetId, index) => {
                const w = DEFAULT_WIDGETS.find((item) => item.id === widgetId);
                return (
                  <div
                    key={widgetId}
                    className="flex items-center justify-between p-3 bg-fundo-sutil dark:bg-navy border border-borda dark:border-borda-dark rounded-[var(--radius-card)]"
                  >
                    <div className="flex items-center gap-2.5 font-medium text-texto-medio dark:text-texto-medio-dark">
                      <span className="w-6 h-6 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro text-primaria dark:text-primaria-clara flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{w?.title || widgetId}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] disabled:opacity-30 text-texto-medio dark:text-texto-medio-dark"
                        title="Subir"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(index, 'down')}
                        disabled={index === widgetOrder.length - 1}
                        className="p-1.5 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] disabled:opacity-30 text-texto-medio dark:text-texto-medio-dark"
                        title="Descer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-borda dark:border-borda-dark">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
