import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  TrendingUp,
  FileCheck2,
  CreditCard,
  Sparkles,
  Users,
  Briefcase,
  HandCoins,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  X,
  Building2,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { activeTab, setActiveTab, lancamentos, configuracoes } = useApp();

  // Contagem de pendências (vencidos sem realizado)
  const pendenciasCount = lancamentos.filter((l) => l.status === 'vencido').length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'lancamentos',
      label: 'Lançamentos',
      icon: Receipt,
      badge: pendenciasCount > 0 ? pendenciasCount : null,
      badgeColor: 'bg-perigo-suave0 text-white',
    },
    {
      id: 'orcado_realizado',
      label: 'Orçado x Realizado',
      icon: Scale,
      badge: null,
    },
    {
      id: 'fluxo_caixa',
      label: 'Fluxo de Caixa',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'conciliacao',
      label: 'Conciliação Extrato',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'cartoes',
      label: 'Cartões de Crédito',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'simulador',
      label: 'Simulador de Previsão',
      icon: Sparkles,
      badge: 'Sandbox',
      badgeColor: 'bg-primaria-suave dark:bg-navy-claro text-primaria dark:text-primaria-clara',
    },
    {
      id: 'clientes',
      label: 'Clientes & Contratos',
      icon: Users,
      badge: null,
    },
    {
      id: 'fornecedores',
      label: 'Equipe / Prestadores PJ',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'reembolsos',
      label: 'Reembolsos de Sócios',
      icon: HandCoins,
      badge: null,
    },
    {
      id: 'relatorios',
      label: 'Relatórios & DRE',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'importacao',
      label: 'Importação de Dados',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    // Em telas pequenas fecha sidebar ao selecionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-navy/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-navy text-texto-medio flex flex-col transition-all duration-300 ease-in-out border-r border-borda-dark ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Topo do Menu: Nome da Agência */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-borda-dark/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-[var(--radius-card)] bg-gradient-to-br from-primaria to-primaria flex items-center justify-center text-white shrink-0 shadow-card">
              <Building2 className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <span className="text-sm font-bold text-white block truncate leading-tight">
                  {configuracoes.dadosEmpresa.nome || 'Agência Financeiro'}
                </span>
                <span className="text-[10px] text-texto-medio font-medium tracking-wide">
                  Orçado x Realizado
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-texto-medio hover:text-white rounded-[var(--radius-controle)] hover:bg-fundo-sutil cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`menu-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] text-xs sm:text-sm font-medium transition-all group cursor-pointer ${
                  isSelected
                    ? 'bg-primaria text-white shadow-card shadow-indigo-600/30'
                    : 'text-texto-medio hover:text-texto-medio hover:bg-fundo-sutil/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isSelected ? 'text-white' : 'text-texto-medio group-hover:text-texto-medio'
                  }`}
                />
                {sidebarOpen && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      item.badgeColor || 'bg-fundo-sutil text-texto-medio'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé do Menu */}
        {sidebarOpen && (
          <div className="p-3 border-t border-borda-dark/80 text-[11px] text-texto-medio text-center">
            Zero Mock • 100% Salvo no Navegador
          </div>
        )}
      </aside>
    </>
  );
};
