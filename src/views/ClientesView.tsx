import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { Client } from '../types';
import { formatCurrency } from '../utils';

interface ClientesViewProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onOpenQuickCreate: (type: string) => void;
  hideValues: boolean;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clients = [],
  onSelectClient,
  onOpenQuickCreate,
  hideValues,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Metrics
  const safeClients = clients || [];
  const totalClients = safeClients.length;
  const activeClients = safeClients.filter((c) => c.financialStatus !== 'inadimplente').length;
  const overdueClients = safeClients.filter((c) => c.financialStatus === 'inadimplente').length;
  const totalMRR = safeClients.reduce((acc, c) => acc + c.monthlyRevenue, 0);

  const filteredClients = safeClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.document.includes(search) ||
      client.contactName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'todos') return true;
    return client.financialStatus === statusFilter;
  });

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Page Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight">Clientes</h1>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            Gerencie os clientes da empresa e acompanhe contratos, faturamento e saúde em tempo real.
          </p>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
          <button
            onClick={() => onOpenQuickCreate('cliente')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-sm font-medium shadow-card transition-colors"
          >
            <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            <span>Novo cliente</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Total de clientes</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio mt-2">{totalClients}</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso mt-1 font-medium">↑ +2 no último mês</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Clientes em dia</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-sucesso mt-2">{activeClients}</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">Adimplência 83%</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'inadimplente' ? 'todos' : 'inadimplente')}
          className={`bg-superficie p-5 rounded-[var(--radius-card)] border transition-all cursor-pointer shadow-card hover:border-perigo ${
            statusFilter === 'inadimplente' ? 'border-perigo ring-2 ring-perigo bg-perigo-suave/20' : 'border-borda'
          }`}
        >
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Inadimplentes</div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-perigo-suave0 animate-pulse" />
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-perigo mt-2">{overdueClients}</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-perigo mt-1 font-medium underline">
            {statusFilter === 'inadimplente' ? 'Exibindo inadimplentes (clique para limpar)' : 'Clique para filtrar inadimplentes'}
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">MRR Total da Carteira</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-primaria mt-2">
            {formatCurrency(totalMRR, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">Ticket médio: R$ 6.880</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-3 rounded-[var(--radius-card)] border border-borda shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
          <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-3 py-1.5 text-xs text-texto-medio placeholder-gray-400 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria"
          />
        </div>

        {/* Filter Chips */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'em_dia', label: 'Em dia' },
            { id: 'inadimplente', label: 'Inadimplentes' },
            { id: 'pendente', label: 'Pendentes' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === chip.id
                  ? 'bg-primaria-suave text-primaria'
                  : 'text-texto-medio hover:bg-fundo-sutil hover:text-texto-medio'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-borda shadow-card overflow-hidden">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark overflow-x-auto">
          <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
            <thead className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil border-b border-borda text-texto-medio uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Cliente / Razão Social</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Contato Principal</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Serviços Contratados</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">MRR Mensal</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Situação</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Saúde</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-gray-100">
              {filteredClients.map((client) => {
                const isOverdue = client.financialStatus === 'inadimplente';
                const healthBadge =
                  client.healthScore === 'saudavel'
                    ? 'bg-sucesso-suave text-sucesso border-sucesso'
                    : client.healthScore === 'atencao'
                    ? 'bg-alerta-suave text-alerta border-alerta'
                    : 'bg-perigo-suave text-perigo border-perigo';

                return (
                  <tr
                    key={client.id}
                    onClick={() => onSelectClient(client)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-fundo-sutil transition-colors cursor-pointer group"
                  >
                    {/* Cliente */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-[var(--radius-controle)] flex items-center justify-center font-bold text-white text-xs ${
                            client.avatarColor || 'bg-primaria'
                          }`}
                        >
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio group-hover:text-primaria transition-colors">
                            {client.name}
                          </div>
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{client.document}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contato */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">{client.contactName}</div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{client.contactEmail}</div>
                    </td>

                    {/* Serviços */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-wrap gap-1">
                        {client.services.map((s, idx) => (
                          <span
                            key={idx}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-md text-[10px] font-medium bg-primaria-suave text-primaria"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* MRR */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-bold text-texto-medio">
                      {formatCurrency(client.monthlyRevenue, hideValues)}
                    </td>

                    {/* Situação */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      {isOverdue ? (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-perigo-suave text-perigo border border-perigo">
                          <AlertCircle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                          Inadimplente ({formatCurrency(client.openBalance, hideValues)})
                        </span>
                      ) : (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sucesso-suave text-sucesso border border-sucesso">
                          <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                          Em dia
                        </span>
                      )}
                    </td>

                    {/* Saúde */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${healthBadge}`}
                      >
                        {client.healthScore}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(client);
                        }}
                        className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 text-primaria hover:text-primaria hover:bg-primaria-suave rounded-[var(--radius-controle)] transition-colors font-medium text-xs inline-flex items-center gap-1"
                      >
                        <span>Cliente 360°</span>
                        <ChevronRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
