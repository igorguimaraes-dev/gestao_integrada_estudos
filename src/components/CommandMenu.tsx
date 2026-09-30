import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
  X,
  PlusCircle,
  Zap,
  RotateCcw,
  Receipt,
  Calendar,
} from 'lucide-react';
import { Client, Contract, ReceivableItem, RouteId } from '../types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
  contracts?: Contract[];
  receivables?: ReceivableItem[];
  onSelectClient?: (client: Client) => void;
  onSelectContract?: (contract: Contract) => void;
  onNavigate?: (route: RouteId) => void;
  onOpenQuickCreate?: (type: string) => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  clients = [],
  contracts = [],
  receivables = [],
  onSelectClient = (_client: Client) => {},
  onSelectContract = (_contract: Contract) => {},
  onNavigate = (_route: RouteId) => {},
  onOpenQuickCreate = (_type: string) => {},
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // handled in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredClients = (clients || []).filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.tradeName?.toLowerCase().includes(query.toLowerCase()) ||
      c.document.includes(query)
  );

  const filteredContracts = (contracts || []).filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.clientName.toLowerCase().includes(query.toLowerCase()) ||
      c.service.toLowerCase().includes(query.toLowerCase())
  );

  const quickActions = [
    {
      label: 'Novo cliente',
      icon: Users,
      action: () => {
        onClose();
        onOpenQuickCreate('cliente');
      },
    },
    {
      label: 'Novo contrato',
      icon: FileText,
      action: () => {
        onClose();
        onOpenQuickCreate('contrato');
      },
    },
    {
      label: 'Nova cobrança no Asaas',
      icon: DollarSign,
      action: () => {
        onClose();
        onOpenQuickCreate('cobranca');
      },
    },
    {
      label: 'Notas Fiscais & Cobranças Asaas',
      icon: Receipt,
      action: () => {
        onClose();
        onNavigate('notas-cobrancas');
      },
    },
    {
      label: 'Abrir Agenda & Calendário',
      icon: Calendar,
      action: () => {
        onClose();
        onNavigate('acoes');
      },
    },
    {
      label: 'Ver Pipeline Comercial',
      icon: ArrowRight,
      action: () => {
        onClose();
        onNavigate('pipeline');
      },
    },
  ];

  return (
    <div
      id="command-palette-backdrop"
      className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="command-palette-box"
        className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full max-w-xl bg-superficie rounded-[var(--radius-card)] shadow-2xl border border-borda overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-3 px-4 py-3.5 border-b border-borda">
          <Search className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-5 h-5 text-texto-medio" />
          <input
            type="text"
            placeholder="Buscar por cliente, CNPJ, contrato, cobrança ou ação..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex-1 text-sm text-texto-medio placeholder-gray-400 focus:outline-hidden"
          />
          <kbd className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-1.5 py-0.5 text-[10px] font-semibold text-texto-medio bg-fundo-sutil border border-borda rounded">
            ESC
          </kbd>
        </div>

        {/* Search Results / Shortcuts */}
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-texto-medio">
                Atalhos rápidos
              </div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-0.5">
                {quickActions.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={act.action}
                      className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full flex items-center justify-between px-3 py-2 text-xs text-texto-medio hover:bg-primaria-suave hover:text-primaria rounded-[var(--radius-controle)] transition-colors text-left"
                    >
                      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                        <Icon className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio" />
                        <span>{act.label}</span>
                      </div>
                      <ArrowRight className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clients Matching */}
          {filteredClients.length > 0 && (
            <div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-texto-medio">
                Clientes ({filteredClients.length})
              </div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-0.5">
                {filteredClients.slice(0, 4).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      onSelectClient(client);
                      onClose();
                    }}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full flex items-center justify-between px-3 py-2 text-xs text-texto-medio hover:bg-primaria-suave hover:text-primaria rounded-[var(--radius-controle)] transition-colors text-left"
                  >
                    <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                      <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-6 h-6 rounded-md bg-primaria-suave text-primaria flex items-center justify-center font-bold text-[10px]">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">{client.name}</span>
                        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark ml-2 text-[11px] text-texto-medio">{client.document}</span>
                      </div>
                    </div>
                    <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-primaria font-medium">Ver 360°</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contracts Matching */}
          {filteredContracts.length > 0 && (
            <div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-texto-medio">
                Contratos ({filteredContracts.length})
              </div>
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-0.5">
                {filteredContracts.slice(0, 4).map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() => {
                      onSelectContract(contract);
                      onClose();
                    }}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full flex items-center justify-between px-3 py-2 text-xs text-texto-medio hover:bg-primaria-suave hover:text-primaria rounded-[var(--radius-controle)] transition-colors text-left"
                  >
                    <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                      <FileText className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-4 h-4 text-texto-medio" />
                      <div>
                        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">{contract.code}</span>
                        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark ml-2 text-[11px] text-texto-medio">{contract.clientName}</span>
                      </div>
                    </div>
                    <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-sucesso font-medium">
                      R$ {contract.value.toLocaleString('pt-BR')}/mês
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredClients.length === 0 && filteredContracts.length === 0 && (
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark py-8 text-center text-xs text-texto-medio">
              Nenhum registro encontrado para &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
