import React, { useState } from 'react';
import {
  ArrowUpCircle,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PayableItem } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';

interface FinanceiroPagarViewProps {
  payables: PayableItem[];
  onTriggerActionToast: (msg: string) => void;
  hideValues: boolean;
}

const payableCategoryData = [
  { name: 'Tráfego & Mídia', value: 32400, color: 'var(--color-primaria)' },
  { name: 'Software & Cloud', value: 24100, color: '#12A66A' },
  { name: 'Equipe & Pró-labore', value: 28500, color: '#F59E0B' },
  { name: 'Outros Custos', value: 11210, color: '#94A3B8' },
];

export const FinanceiroPagarView: React.FC<FinanceiroPagarViewProps> = ({
  payables = [],
  onTriggerActionToast,
  hideValues,
}) => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PayableItem[]>(payables || []);
  const [viewMode, setViewMode] = useState<'tabela' | 'grafico'>('tabela');

  const totalAPagar = (items || []).reduce((acc, p) => acc + p.amount, 0);

  const filtered = (items || []).filter((p) =>
    p.supplier.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = (id: string, supplier: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'pago' } : it))
    );
    onTriggerActionToast(`Pagamento de ${supplier} liquidado com sucesso!`);
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight">Contas a Pagar</h1>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            Gestão de despesas com fornecedores, softwares, infraestrutura e rateio por centro de custo.
          </p>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil p-1 rounded-[var(--radius-controle)] flex items-center gap-1">
            <button
              onClick={() => setViewMode('tabela')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'tabela' ? 'bg-superficie text-texto-medio shadow-sutil' : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <TableIcon className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grafico')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'grafico' ? 'bg-superficie text-texto-medio shadow-sutil' : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <BarChart3 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Gráficos Recharts</span>
            </button>
          </div>

          <button
            onClick={() => onTriggerActionToast('Formulário de nova despesa aberto')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-sm font-medium shadow-card transition-colors"
          >
            <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            <span>Nova despesa</span>
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Total a Pagar no Mês</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio mt-2">
            {formatCurrency(51270, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">4 lançamentos programados</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Total Já Pago</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-sucesso mt-2">
            {formatCurrency(31500, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Liquidadas este mês</span>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Pendente (A Vencer)</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-perigo mt-2">
            {formatCurrency(19770, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-perigo mt-1 font-medium flex items-center gap-1">
            <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Vence nos próximos dias</span>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Comprovantes Vinculados</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-sucesso mt-2">100%</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso font-medium mt-1">Pronto para a contabilidade</div>
        </div>
      </div>

      {viewMode === 'grafico' ? (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card">
            <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio mb-1">Despesas por Centro de Custo / Categoria</h2>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mb-6">Comparativo de desembolsos mensais.</p>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payableCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), hideValues), 'Valor']}
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#D92D4E" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card flex flex-col justify-between">
            <div>
              <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio mb-1">Composição das Contas a Pagar</h2>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mb-4">Participação percentual por categoria.</p>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payableCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {payableCategoryData.map((entry, index) => (
                        <Cell key={`cell-pay-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), hideValues), 'Valor']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-2 pt-4 border-t border-borda text-center text-xs">
              {payableCategoryData.map((item) => (
                <div key={item.name} className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between px-2">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio text-[11px]">{item.name}</span>
                  </div>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio text-[11px]">{formatCurrency(item.value, hideValues)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Table */
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-borda shadow-card overflow-hidden">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 border-b border-borda flex items-center justify-between gap-3">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
              <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por fornecedor ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-3 py-1.5 text-xs text-texto-medio placeholder-gray-400 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria"
              />
            </div>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark overflow-x-auto">
            <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
              <thead className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil border-b border-borda text-texto-medio uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Fornecedor</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Descrição</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Centro de Custo</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Vencimento</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Valor</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Status</th>
                  <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-fundo-sutil transition-colors">
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-semibold text-texto-medio">{item.supplier}</td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio">{item.description}</td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-fundo-sutil text-texto-medio">
                        {item.costCenter}
                      </span>
                    </td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio">{item.dueDate}</td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-bold text-perigo">
                      {formatCurrencyDetailed(item.amount, hideValues)}
                    </td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          item.status === 'pago'
                            ? 'bg-sucesso-suave text-sucesso'
                            : 'bg-alerta-suave text-alerta'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">
                      {item.status !== 'pago' ? (
                        <button
                          onClick={() => handlePay(item.id, item.supplier)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-md text-xs font-medium transition-colors"
                        >
                          Baixar
                        </button>
                      ) : (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso font-medium text-xs">✓ Liquidado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
