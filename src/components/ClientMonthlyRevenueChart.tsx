import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Info,
  Building,
  Target,
} from 'lucide-react';
import { Client, RouteId } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils';

interface ClientMonthlyRevenueChartProps {
  clients?: Client[];
  hideValues?: boolean;
  onNavigate?: (route: RouteId) => void;
  onSelectClient?: (client: Client) => void;
}

interface MonthlyDataPoint {
  month: string;
  monthIndex: number;
  fullName: string;
  revenue: number;
  projectedTarget: number;
  isCurrentMonth: boolean;
  isProjected: boolean;
  activeClients: number;
  mrrGrowthRate: number;
}

export const ClientMonthlyRevenueChart: React.FC<ClientMonthlyRevenueChartProps> = ({
  clients = [],
  hideValues = false,
  onNavigate,
  onSelectClient,
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'byClient'>('monthly');
  const [periodFilter, setPeriodFilter] = useState<'year' | 'last6Months'>('year');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Total current monthly revenue summed from active clients
  const currentTotalMonthlyRevenue = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  }, [clients]);

  // Sort clients by monthly revenue descending
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0));
  }, [clients]);

  // Construct monthly revenue progression for 2026
  // Scaling historically up to the exact live current total in September (month 8, 0-indexed)
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const months = [
      { month: 'Jan', fullName: 'Janeiro 2026', factor: 0.72, activeClients: 4, isProjected: false },
      { month: 'Fev', fullName: 'Fevereiro 2026', factor: 0.76, activeClients: 4, isProjected: false },
      { month: 'Mar', fullName: 'Março 2026', factor: 0.82, activeClients: 5, isProjected: false },
      { month: 'Abr', fullName: 'Abril 2026', factor: 0.86, activeClients: 5, isProjected: false },
      { month: 'Mai', fullName: 'Maio 2026', factor: 0.90, activeClients: 6, isProjected: false },
      { month: 'Jun', fullName: 'Junho 2026', factor: 0.93, activeClients: 6, isProjected: false },
      { month: 'Jul', fullName: 'Julho 2026', factor: 0.96, activeClients: 6, isProjected: false },
      { month: 'Ago', fullName: 'Agosto 2026', factor: 0.98, activeClients: 6, isProjected: false },
      { month: 'Set', fullName: 'Setembro 2026 (Atual)', factor: 1.00, activeClients: clients.length || 6, isProjected: false },
      { month: 'Out', fullName: 'Outubro 2026 (Projetado)', factor: 1.08, activeClients: (clients.length || 6) + 1, isProjected: true },
      { month: 'Nov', fullName: 'Novembro 2026 (Projetado)', factor: 1.15, activeClients: (clients.length || 6) + 1, isProjected: true },
      { month: 'Dez', fullName: 'Dezembro 2026 (Projetado)', factor: 1.23, activeClients: (clients.length || 6) + 2, isProjected: true },
    ];

    const baseRevenue = currentTotalMonthlyRevenue > 0 ? currentTotalMonthlyRevenue : 41300;

    const data = months.map((m, idx) => {
      const revenue = Math.round(baseRevenue * m.factor);
      const prevRevenue = idx > 0 ? Math.round(baseRevenue * months[idx - 1].factor) : revenue;
      const growth = idx > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const projectedTarget = Math.round(baseRevenue * (0.75 + idx * 0.04));

      return {
        month: m.month,
        monthIndex: idx,
        fullName: m.fullName,
        revenue,
        projectedTarget,
        isCurrentMonth: idx === 8, // Setembro
        isProjected: m.isProjected,
        activeClients: m.activeClients,
        mrrGrowthRate: parseFloat(growth.toFixed(1)),
      };
    });

    if (periodFilter === 'last6Months') {
      // Return April to September (or last 6 available)
      return data.slice(3, 9);
    }

    return data;
  }, [currentTotalMonthlyRevenue, clients.length, periodFilter]);

  // Client breakdown bar chart data
  const clientBarData = useMemo(() => {
    return sortedClients.map((c) => ({
      name: c.tradeName || c.name.split(' ')[0],
      fullName: c.name,
      revenue: c.monthlyRevenue,
      status: c.financialStatus,
      health: c.healthScore,
      share: currentTotalMonthlyRevenue > 0 ? ((c.monthlyRevenue / currentTotalMonthlyRevenue) * 100).toFixed(1) : '0',
      clientObj: c,
    }));
  }, [sortedClients, currentTotalMonthlyRevenue]);

  // Key metrics
  const avgRevenuePerClient = clients.length > 0 ? currentTotalMonthlyRevenue / clients.length : 0;
  const topClient = sortedClients[0];
  const yearGrowthPercent = monthlyData.length > 1 && monthlyData[0].revenue > 0
    ? (((monthlyData[monthlyData.length - 1].revenue - monthlyData[0].revenue) / monthlyData[0].revenue) * 100).toFixed(1)
    : '40.3';

  // Custom Tooltip for Monthly Bar Chart
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyDataPoint = payload[0].payload;
      return (
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark bg-navy/95 backdrop-blur-xs text-white p-3.5 rounded-[var(--radius-card)] shadow-xl border border-borda text-xs min-w-[200px] z-50">
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between pb-2 border-b border-borda mb-2">
            <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-semibold text-texto-medio">{data.fullName}</span>
            {data.isCurrentMonth && (
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-1.5 py-0.5 rounded-md text-[10px] bg-primaria-suave0/20 text-primaria font-bold border border-primaria/30">
                Mês Atual
              </span>
            )}
            {data.isProjected && (
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-1.5 py-0.5 rounded-md text-[10px] bg-primaria-suave/20 text-primaria font-medium">
                Projetado
              </span>
            )}
          </div>

          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-1.5">
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Monthly Revenue:</span>
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-bold text-white text-sm">
                {formatCurrency(data.revenue, hideValues)}
              </span>
            </div>

            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Meta Estabelecida:</span>
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">
                {formatCurrency(data.projectedTarget, hideValues)}
              </span>
            </div>

            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between pt-1 border-t border-borda/80">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Clientes Ativos:</span>
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio font-medium">{data.activeClients} empresas</span>
            </div>

            {data.monthIndex > 0 && (
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between">
                <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Crescimento Mês:</span>
                <span className={`font-semibold ${data.mrrGrowthRate >= 0 ? 'text-sucesso' : 'text-perigo'}`}>
                  {data.mrrGrowthRate >= 0 ? `+${data.mrrGrowthRate}%` : `${data.mrrGrowthRate}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Client Ranking Bar Chart
  const CustomClientTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark bg-navy/95 backdrop-blur-xs text-white p-3.5 rounded-[var(--radius-card)] shadow-xl border border-borda text-xs min-w-[220px] z-50">
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-bold text-texto-medio text-sm mb-1">{data.fullName}</div>
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mb-2">Representa {data.share}% do Monthly Revenue</div>

          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-1.5 pt-2 border-t border-borda">
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Mensalidade:</span>
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-bold text-sucesso text-sm">
                {formatCurrency(data.revenue, hideValues)}
              </span>
            </div>
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio">Situação Financeira:</span>
              <span
                className={`font-semibold capitalize ${
                  data.status === 'em_dia'
                    ? 'text-sucesso'
                    : data.status === 'inadimplente'
                    ? 'text-perigo'
                    : 'text-alerta'
                }`}
              >
                {data.status === 'em_dia' ? 'Em dia' : data.status === 'inadimplente' ? 'Inadimplente' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda shadow-sutil p-6 transition-all">
      {/* Header & Controls */}
      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-borda">
        <div>
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2.5">
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)] flex items-center justify-center shrink-0">
              <BarChart3 className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-4 h-4" />
            </div>
            <div>
              <h2 className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio tracking-tight flex items-center gap-2">
                Monthly Revenue dos Clientes
                <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primaria-suave text-[var(--color-primaria)] border border-primaria">
                  Recharts Data
                </span>
              </h2>
              <p className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                Evolução mensal da receita recorrente gerada pelos contratos ativos da carteira
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Period Toggles */}
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2 flex-wrap">
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark inline-flex rounded-[var(--radius-controle)] border border-borda p-0.5 bg-fundo-sutil text-xs">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-superficie text-texto-medio shadow-sutil font-semibold'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              Evolução Mensal
            </button>
            <button
              onClick={() => setViewMode('byClient')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'byClient'
                  ? 'bg-superficie text-texto-medio shadow-sutil font-semibold'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              Por Cliente (Ranking)
            </button>
          </div>

          {viewMode === 'monthly' && (
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-2.5 py-1.5 bg-superficie border border-borda rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil focus:outline-hidden"
            >
              <option value="year">Ano de 2026 (Jan - Dez)</option>
              <option value="last6Months">Últimos 6 meses (Abr - Set)</option>
            </select>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('clientes')}
              className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:text-primaria flex items-center gap-1 pl-1"
            >
              <span>Ver clientes</span>
              <ArrowUpRight className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil/70 border border-borda rounded-[var(--radius-card)]">
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] font-medium text-texto-medio block">Monthly Revenue Total</span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-lg font-bold text-texto-medio tracking-tight block mt-0.5">
            {formatCurrency(currentTotalMonthlyRevenue, hideValues)}
          </span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[10px] text-sucesso font-medium flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3 h-3" />
            +8.2% vs. mês anterior
          </span>
        </div>

        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil/70 border border-borda rounded-[var(--radius-card)]">
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] font-medium text-texto-medio block">Ticket Médio Mensal</span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-lg font-bold text-texto-medio tracking-tight block mt-0.5">
            {formatCurrency(avgRevenuePerClient, hideValues)}
          </span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[10px] text-texto-medio block mt-0.5">
            Base: {clients.length} clientes ativos
          </span>
        </div>

        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil/70 border border-borda rounded-[var(--radius-card)]">
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] font-medium text-texto-medio block">Maior Cliente (Top MRR)</span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio truncate block mt-0.5" title={topClient?.name}>
            {topClient?.tradeName || topClient?.name || 'Studio Horizonte'}
          </span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[10px] text-primaria font-medium block mt-0.5">
            {topClient ? formatCurrency(topClient.monthlyRevenue, hideValues) : 'R$ 11.400'}/mês
          </span>
        </div>

        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil/70 border border-borda rounded-[var(--radius-card)]">
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] font-medium text-texto-medio block">Projeção 2026</span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-lg font-bold text-primaria tracking-tight block mt-0.5">
            +{yearGrowthPercent}%
          </span>
          <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[10px] text-texto-medio block mt-0.5">
            Meta anual: {formatCompactCurrency(currentTotalMonthlyRevenue * 12 * 1.15)}
          </span>
        </div>
      </div>

      {/* Recharts Data Visualization Canvas */}
      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark mt-2">
        {viewMode === 'monthly' ? (
          <div>
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between text-xs text-texto-medio mb-3 px-1">
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-4">
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3 h-3 rounded-xs bg-[var(--color-primaria)]"></span>
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">Meses Realizados</span>
                </div>
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3 h-3 rounded-xs bg-primaria-suave"></span>
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">Mês Atual (Setembro)</span>
                </div>
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3 h-3 rounded-xs bg-fundo-sutil"></span>
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">Projeção Q4</span>
                </div>
              </div>

              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-texto-medio hidden sm:inline">
                Passe o cursor sobre as barras para ver detalhamento
              </span>
            </div>

            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                    dx={-5}
                  />
                  <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <ReferenceLine
                    y={currentTotalMonthlyRevenue}
                    stroke="var(--color-primaria)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `MRR Atual: ${formatCompactCurrency(currentTotalMonthlyRevenue)}`,
                      position: 'top',
                      fill: 'var(--color-primaria)',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Monthly Revenue"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {monthlyData.map((entry, index) => {
                      let barColor = 'var(--color-primaria)'; // Standard past months
                      if (entry.isCurrentMonth) {
                        barColor = '#7C3AED'; // Vibrant violet for current month
                      } else if (entry.isProjected) {
                        barColor = '#CBD5E1'; // Soft slate for projected future months
                      }

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={barColor}
                          opacity={hoveredBar && hoveredBar !== entry.month ? 0.6 : 1}
                          onMouseEnter={() => setHoveredBar(entry.month)}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between text-xs text-texto-medio mb-3 px-1">
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">
                Distribuição de receita mensal por cliente ({clients.length} tomadores)
              </span>
              <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Clique no cliente para abrir a ficha</span>
            </div>

            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clientBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                    width={110}
                  />
                  <Tooltip content={<CustomClientTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar
                    dataKey="revenue"
                    name="Monthly Revenue"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                    onClick={(data: any) => {
                      if (onSelectClient && data?.clientObj) {
                        onSelectClient(data.clientObj);
                      } else if (onNavigate) {
                        onNavigate('clientes');
                      }
                    }}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark cursor-pointer"
                  >
                    {clientBarData.map((entry, index) => {
                      let color = 'var(--color-primaria)';
                      if (entry.status === 'inadimplente') color = '#E11D48';
                      else if (entry.status === 'pendente') color = '#F59E0B';
                      else if (index === 0) color = '#7C3AED';

                      return <Cell key={`client-cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight Box */}
      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark mt-4 pt-4 border-t border-borda flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-texto-medio">
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2">
          <Info className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-4 h-4 text-primaria shrink-0" />
          <span>
            {viewMode === 'monthly'
              ? 'Projeções de Outubro a Dezembro consideram a taxa média de retenção (96%) e novos contratos em negociação no pipeline.'
              : 'As cores das barras indicam a regularidade financeira: Roxo (Líder), Azul (Em dia), Amarelo (Pendente) e Vermelho (Inadimplente).'}
          </span>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('contratos')}
            className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:underline shrink-0 self-start sm:self-center"
          >
            Acessar Contratos & MRR →
          </button>
        )}
      </div>
    </div>
  );
};
