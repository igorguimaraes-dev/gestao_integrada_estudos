import React, { useState } from 'react';
import {
  AlertTriangle,
  MessageCircle,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Send,
  Building2,
  Filter,
} from 'lucide-react';
import { Client, ReceivableItem } from '../types';
import { formatCurrency } from '../utils';

interface InadimplentesDashboardProps {
  clients: Client[];
  receivables: ReceivableItem[];
  onTriggerActionToast: (msg: string) => void;
  hideValues: boolean;
}

export const InadimplentesDashboard: React.FC<InadimplentesDashboardProps> = ({
  clients = [],
  receivables = [],
  onTriggerActionToast,
  hideValues,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'amigavel' | 'urgente' | 'juridico'>('amigavel');

  // Filter clients with overdue status or receivables overdue
  const overdueClients = clients.filter(c => {
    const hasOverdueReceivable = receivables.some(
      r => r.clientId === c.id && r.status === 'vencida'
    );
    return c.financialStatus === 'inadimplente' || hasOverdueReceivable;
  });

  const filtered = overdueClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.document.includes(search)
  );

  const totalOverdueAmount = overdueClients.reduce((acc, c) => {
    const clientReceivables = receivables
      .filter(r => r.clientId === c.id && r.status === 'vencida')
      .reduce((sum, r) => sum + r.amount, 0);
    return acc + (clientReceivables > 0 ? clientReceivables : c.openBalance || 4200);
  }, 0);

  const handleWhatsAppSend = (clientName: string, phone: string, amount: number, daysLate: number) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedAmount = formatCurrency(amount, hideValues);
    
    let msg = '';
    if (selectedTemplate === 'amigavel') {
      msg = `Olá ${clientName}, tudo bem? Notamos que há uma fatura em aberto no valor de ${formattedAmount} (vencida há ${daysLate} dias). Podemos ajudar com a 2ª via ou chave Pix para regularização?`;
    } else if (selectedTemplate === 'urgente') {
      msg = `Olá ${clientName}, informamos que sua fatura de ${formattedAmount} encontra-se vencida há ${daysLate} dias. Solicitamos a regularização urgente para evitar suspensão dos serviços e encargos adicionais.`;
    } else {
      msg = `Prezado(a) ${clientName}, última notificação para regularização de débito pendente no valor de ${formattedAmount} (Atraso de ${daysLate} dias). Evite encaminhamento para protesto.`;
    }

    const encoded = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encoded}`;
    
    // Open WhatsApp link
    window.open(url, '_blank');
    onTriggerActionToast(`Mensagem de cobrança via WhatsApp aberta para ${clientName}`);
  };

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight flex items-center gap-2">
            <AlertTriangle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 text-perigo" />
            <span>Dashboard de Inadimplência</span>
          </h1>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            Controle de clientes em atraso, cálculo de tempo de atraso e envio instantâneo de cobrança via WhatsApp.
          </p>
        </div>

        {/* Template Selector */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 bg-superficie p-1.5 rounded-[var(--radius-card)] border border-borda shadow-card text-xs">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio px-2 font-medium">Modelo WhatsApp:</span>
          <button
            onClick={() => setSelectedTemplate('amigavel')}
            className={`px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-colors ${
              selectedTemplate === 'amigavel' ? 'bg-primaria-suave text-primaria font-semibold' : 'text-texto-medio hover:bg-fundo-sutil'
            }`}
          >
            Amigável
          </button>
          <button
            onClick={() => setSelectedTemplate('urgente')}
            className={`px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-colors ${
              selectedTemplate === 'urgente' ? 'bg-alerta-suave text-alerta font-semibold' : 'text-texto-medio hover:bg-fundo-sutil'
            }`}
          >
            Urgente
          </button>
          <button
            onClick={() => setSelectedTemplate('juridico')}
            className={`px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-colors ${
              selectedTemplate === 'juridico' ? 'bg-perigo-suave text-perigo font-semibold' : 'text-texto-medio hover:bg-fundo-sutil'
            }`}
          >
            Aviso Legal
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Total Inadimplente</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-perigo mt-2">
            {formatCurrency(totalOverdueAmount, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-perigo mt-1 font-medium">Montante total em atraso</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Clientes em Atraso</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio mt-2">
            {overdueClients.length} empresas
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">Requerem ação imediata de cobrança</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Média de Atraso</div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-alerta mt-2">
            18 dias
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-alerta mt-1 font-medium">Faixa crítica de recuperação</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-3 rounded-[var(--radius-card)] border border-borda shadow-card flex items-center justify-between">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
          <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar cliente inadimplente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-3 py-1.5 text-xs text-texto-medio placeholder-gray-400 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria"
          />
        </div>
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
          Exibindo {filtered.length} de {overdueClients.length} inadimplentes
        </div>
      </div>

      {/* Inadimplentes Table */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-borda shadow-card overflow-hidden">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark overflow-x-auto">
          <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
            <thead className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil border-b border-borda text-texto-medio uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Cliente / CNPJ</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Contato Responsável</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Tempo de Atraso</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">Valor Devido</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">WhatsApp</th>
                <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">Ação Direta</th>
              </tr>
            </thead>
            <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-gray-100">
              {filtered.map((client, index) => {
                // Determine mock days late and amount
                const daysLate = index === 0 ? 32 : index === 1 ? 14 : index === 2 ? 21 : 12;
                const clientReceivables = receivables.filter(r => r.clientId === client.id && r.status === 'vencida');
                const dueAmount = clientReceivables.reduce((sum, r) => sum + r.amount, 0) || client.openBalance || 3800;

                return (
                  <tr key={client.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-fundo-sutil transition-colors">
                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-controle)] bg-perigo-suave text-perigo flex items-center justify-center font-bold text-xs">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">{client.name}</div>
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{client.document}</div>
                        </div>
                      </div>
                    </td>

                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">{client.contactName}</div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{client.contactPhone}</div>
                    </td>

                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-perigo-suave text-perigo border border-perigo">
                        <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                        {daysLate} dias em atraso
                      </span>
                    </td>

                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-bold text-perigo text-sm">
                      {formatCurrency(dueAmount, hideValues)}
                    </td>

                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio font-medium">
                      {client.contactPhone}
                    </td>

                    <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleWhatsAppSend(client.contactName, client.contactPhone, dueAmount, daysLate)}
                        className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1.5 px-3 py-1.5 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil transition-colors"
                      >
                        <MessageCircle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 fill-current" />
                        <span>Cobrar via WhatsApp</span>
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
