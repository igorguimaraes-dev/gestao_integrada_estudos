import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Columns3,
  Users,
  FileText,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plug,
  Settings,
  HelpCircle,
  ChevronDown,
  Receipt,
  Sparkles,
  Bot,
  AlertTriangle,
  Scale,
  TrendingUp,
  CreditCard,
  Briefcase,
  HandCoins,
  UploadCloud,
  BarChart3,
  Tags,
  X,
} from 'lucide-react';
import { RouteId } from '../types';

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  collapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  urgentActionsCount?: number;
}

type CollapsedMenuId = 'main' | 'financial' | 'settings';

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  isCollapsed,
  urgentActionsCount = 0,
}) => {
  const isClosed = isCollapsed ?? collapsed ?? false;
  const [isMainSectionOpen, setIsMainSectionOpen] = useState(false);
  const [isFinancialSectionOpen, setIsFinancialSectionOpen] = useState(false);
  const [isSettingsSectionOpen, setIsSettingsSectionOpen] = useState(false);
  const [activeCollapsedMenu, setActiveCollapsedMenu] = useState<CollapsedMenuId | null>(null);

  const navItems = [
    { id: 'dashboard' as RouteId, label: 'Início', icon: LayoutDashboard },
    { id: 'assistente-ia' as RouteId, label: 'Copiloto IA', icon: Bot, unavailable: true },
    {
      id: 'acoes' as RouteId,
      label: 'Agenda & Calendário',
      icon: Calendar,
      unavailable: true,
    },
    { id: 'pipeline' as RouteId, label: 'Pipeline', icon: Columns3, unavailable: true },
    { id: 'clientes' as RouteId, label: 'Clientes', icon: Users, unavailable: true },
    { id: 'inadimplentes' as RouteId, label: 'Inadimplência', icon: AlertTriangle, unavailable: true },
    { id: 'contratos' as RouteId, label: 'Contratos', icon: FileText, unavailable: true },
  ];

  const financialItems = [
    { id: 'financeiro' as RouteId, label: 'Dashboard', icon: Wallet },
    { id: 'financeiro-lancamentos' as RouteId, label: 'Lançamentos', icon: Receipt },
    { id: 'financeiro-orcado-realizado' as RouteId, label: 'Orçado x Realizado', icon: Scale },
    { id: 'financeiro-fluxo-caixa' as RouteId, label: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'conciliacao' as RouteId, label: 'Conciliação Extrato', icon: Sparkles },
    { id: 'financeiro-cartoes' as RouteId, label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'financeiro-simulador' as RouteId, label: 'Simulador de Previsão', icon: Sparkles, badgeText: 'Sandbox' },
    { id: 'financeiro-equipe' as RouteId, label: 'Equipe / Prestadores PJ', icon: Briefcase },
    { id: 'financeiro-reembolsos' as RouteId, label: 'Reembolsos de Sócios', icon: HandCoins },
    { id: 'financeiro-relatorios' as RouteId, label: 'Relatórios & DRE', icon: BarChart3 },
    { id: 'financeiro-importacao' as RouteId, label: 'Importação de Dados', icon: UploadCloud },
    { id: 'financeiro-categorias' as RouteId, label: 'Categorias', icon: Tags },
    { id: 'financeiro-configuracoes' as RouteId, label: 'Configurações', icon: Settings },
  ];

  const bottomItems = [
    { id: 'integracoes' as RouteId, label: 'Integrações', icon: Plug },
    { id: 'configuracoes' as RouteId, label: 'Configurações', icon: Settings },
  ];

  const collapsedMenus = {
    main: { label: 'Principal', items: navItems },
    financial: { label: 'Financeiro', items: financialItems },
    settings: { label: 'Configurações', items: bottomItems },
  };
  const activeCollapsedGroup = activeCollapsedMenu ? collapsedMenus[activeCollapsedMenu] : null;
  const isMainSubmenuVisible = !isClosed && isMainSectionOpen;
  const isFinancialSubmenuVisible = !isClosed && isFinancialSectionOpen;
  const isSettingsSubmenuVisible = !isClosed && isSettingsSectionOpen;

  const isNavActive = (id: RouteId) => {
    if (currentRoute === id) return true;
    if (id === 'clientes' && currentRoute === 'cliente-detalhe') return true;
    if (id === 'contratos' && currentRoute === 'contrato-detalhe') return true;
    if (id === 'integracoes' && currentRoute === 'integracao-detalhe') return true;
    return false;
  };

  return (
    <aside
      id="main-sidebar"
      className={`bg-superficie dark:bg-superficie-dark border-r border-borda dark:border-borda-dark flex flex-col justify-between transition-all duration-200 ${activeCollapsedMenu ? 'z-40' : 'z-20'} select-none ${
        isClosed ? 'w-18' : 'w-64'
      } shrink-0 h-screen sticky top-0 relative`}
    >
      {/* App & Tenant Brand Header */}
      <div className={`p-5 border-b border-borda dark:border-borda-dark flex items-center ${isClosed ? 'justify-center p-3' : 'gap-3'}`}>
        <div className="w-9 h-9 bg-primaria rounded-[var(--radius-card)] flex items-center justify-center shadow-sutil shrink-0 p-1.5 text-white">
          <svg viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M36 60L22 24H12L28 66H38L54 24H44L36 60ZM74 24C65.5 24 59 30.5 59 39C59 54 83 44 83 54C83 58.5 78.5 62 72 62C65 62 60 58.5 59 55L53 60.5C55.5 64.5 62 67 71 67C81 67 89 61 89 52C89 37 65 47 65 37C65 32.5 69.5 29 74 29C80 29 84 32.5 85 36L91 30.5C88.5 26.5 82 24 74 24ZM115 24C106.5 24 100 30.5 100 39C100 54 124 44 124 54C124 58.5 119.5 62 113 62C106 62 101 58.5 100 55L94 60.5C96.5 64.5 103 67 112 67C122 67 130 61 130 52C130 37 106 47 106 37C106 32.5 110.5 29 115 29C121 29 125 32.5 126 36L132 30.5C129.5 26.5 123 24 115 24ZM156 24C147.5 24 141 30.5 141 39C141 54 165 44 165 54C165 58.5 160.5 62 154 62C147 62 142 58.5 141 55L135 60.5C137.5 64.5 144 67 153 67C163 67 171 61 171 52C171 37 147 47 147 37C147 32.5 151.5 29 156 29C162 29 166 32.5 167 36L173 30.5C170.5 26.5 164 24 156 24ZM214 24C198 24 186 35 186 51C186 63 197 67 205 67C214 67 220 63 223 60L218 55C216 57 211 61 205 61C200 61 193 57 193 49H228C228 47 228 24 214 24ZM193 44C194 33 201 29 207 29C213 29 219 33 220 44H193Z" fill="#FFFFFF" />
          </svg>
        </div>
        {!isClosed && (
          <div className="min-w-0 flex-1">
            <span className="font-bold text-base tracking-tight text-texto-forte dark:text-texto-forte-dark block truncate">
              Asaas Conta PJ
            </span>
            <span className="text-[11px] text-sucesso dark:text-texto-forte-dark font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sucesso-suave0 animate-pulse"></span>
              Conta Principal
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isClosed && (
          <div className="space-y-1 border-b border-borda pb-3 dark:border-borda-dark">
            <button
              type="button"
              aria-label="Abrir seção Principal"
              aria-describedby="collapsed-tooltip-main"
              aria-expanded={activeCollapsedMenu === 'main'}
              aria-controls="collapsed-menu-main"
              onClick={() => setActiveCollapsedMenu((menu) => menu === 'main' ? null : 'main')}
              className="group relative flex w-full items-center justify-center rounded-[var(--radius-controle)] p-2 text-texto-medio transition-colors hover:bg-fundo-sutil hover:text-texto-forte focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria dark:text-texto-suave-dark dark:hover:bg-fundo-sutil dark:hover:text-white"
            >
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              <span id="collapsed-tooltip-main" role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-controle)] bg-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-superficie-dark">
                Principal
              </span>
            </button>
            <button
              type="button"
              aria-label="Abrir seção Financeiro"
              aria-describedby="collapsed-tooltip-financial"
              aria-expanded={activeCollapsedMenu === 'financial'}
              aria-controls="collapsed-menu-financial"
              onClick={() => setActiveCollapsedMenu((menu) => menu === 'financial' ? null : 'financial')}
              className="group relative flex w-full items-center justify-center rounded-[var(--radius-controle)] p-2 text-texto-medio transition-colors hover:bg-fundo-sutil hover:text-texto-forte focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria dark:text-texto-suave-dark dark:hover:bg-fundo-sutil dark:hover:text-white"
            >
              <Wallet className="h-5 w-5" aria-hidden="true" />
              <span id="collapsed-tooltip-financial" role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-controle)] bg-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-superficie-dark">
                Financeiro
              </span>
            </button>
            <button
              type="button"
              aria-label="Abrir seção Configurações"
              aria-describedby="collapsed-tooltip-settings"
              aria-expanded={activeCollapsedMenu === 'settings'}
              aria-controls="collapsed-menu-settings"
              onClick={() => setActiveCollapsedMenu((menu) => menu === 'settings' ? null : 'settings')}
              className="group relative flex w-full items-center justify-center rounded-[var(--radius-controle)] p-2 text-texto-medio transition-colors hover:bg-fundo-sutil hover:text-texto-forte focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria dark:text-texto-suave-dark dark:hover:bg-fundo-sutil dark:hover:text-white"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              <span id="collapsed-tooltip-settings" role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-controle)] bg-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100 dark:bg-superficie-dark">
                Configurações
              </span>
            </button>
          </div>
        )}

        {/* Main section */}
        <div>
          {!isClosed && (
            <button
              type="button"
              onClick={() => setIsMainSectionOpen((isOpen) => !isOpen)}
              aria-expanded={isMainSectionOpen}
              aria-controls="main-navigation-items"
              aria-label={`${isMainSectionOpen ? 'Recolher' : 'Expandir'} seção Principal`}
              className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-texto-suave dark:text-texto-suave-dark uppercase tracking-wider rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-medio dark:hover:text-texto-medio transition-colors"
            >
              <span>Principal</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isMainSectionOpen ? '' : '-rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          )}
          <div
            id="main-navigation-items"
            aria-hidden={!isMainSubmenuVisible}
            inert={!isMainSubmenuVisible}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
              isMainSubmenuVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-1">
                {navItems.filter((item) => !isClosed || !item.unavailable).map((item) => {
              const active = isNavActive(item.id);
              const Icon = item.icon;
              const unavailable = item.unavailable === true;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => !unavailable && onNavigate(item.id)}
                  disabled={unavailable}
                  aria-disabled={unavailable}
                  title={unavailable ? 'Em construção' : isClosed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isClosed ? 'justify-center px-2' : 'px-2.5'
                  } py-2 text-sm font-medium rounded-[var(--radius-controle)] transition-colors ${
                    unavailable
                      ? 'cursor-not-allowed text-texto-suave dark:text-texto-medio-dark opacity-70'
                      : active
                      ? 'bg-primaria-suave dark:bg-navy-claro text-primaria dark:text-primaria-clara font-semibold'
                      : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-forte dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      unavailable
                        ? 'text-texto-suave dark:text-texto-medio-dark'
                        : active
                          ? 'text-primaria dark:text-primaria-clara'
                          : 'text-texto-suave dark:text-texto-suave-dark group-hover:text-texto-medio'
                    } ${!isClosed ? 'mr-3' : ''}`}
                  />
                  {!isClosed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!isClosed && unavailable && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-[var(--radius-controle)] bg-alerta-suave dark:bg-superficie-dark/40 text-alerta dark:text-texto-forte-dark border border-alerta dark:border-borda-dark/50">
                      Em construção
                    </span>
                  )}
                </button>
              );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Financeiro Section */}
        <div>
          {!isClosed && (
            <button
              type="button"
              onClick={() => setIsFinancialSectionOpen((isOpen) => !isOpen)}
              aria-expanded={isFinancialSectionOpen}
              aria-controls="financial-navigation-items"
              aria-label={`${isFinancialSectionOpen ? 'Recolher' : 'Expandir'} seção Financeiro`}
              className="w-full flex items-center justify-between px-2 py-2 mt-2 text-xs font-semibold text-texto-suave dark:text-texto-suave-dark uppercase tracking-wider rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-medio dark:hover:text-texto-medio transition-colors"
            >
              <span>Financeiro</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isFinancialSectionOpen ? '' : '-rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          )}
          <div
            id="financial-navigation-items"
            aria-hidden={!isFinancialSubmenuVisible}
            inert={!isFinancialSubmenuVisible}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
              isFinancialSubmenuVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-1">
                {financialItems.map((item) => {
              const active = isNavActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  title={isClosed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isClosed ? 'justify-center px-2' : 'px-2.5'
                  } py-2 text-sm font-medium rounded-[var(--radius-controle)] transition-colors ${
                    active
                      ? 'bg-primaria-suave dark:bg-navy-claro text-primaria dark:text-primaria-clara font-semibold'
                      : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-forte dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      active ? 'text-primaria dark:text-primaria-clara' : 'text-texto-suave dark:text-texto-suave-dark'
                    } ${!isClosed ? 'mr-3' : ''}`}
                  />
                  {!isClosed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!isClosed && (item as any).badgeText && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/50 text-primaria dark:text-primaria-clara border border-primaria dark:border-borda-dark/60">
                      {(item as any).badgeText}
                    </span>
                  )}
                </button>
              );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Settings and Tools Section */}
        <div>
          {!isClosed && (
            <button
              type="button"
              onClick={() => setIsSettingsSectionOpen((isOpen) => !isOpen)}
              aria-expanded={isSettingsSectionOpen}
              aria-controls="settings-navigation-items"
              aria-label={`${isSettingsSectionOpen ? 'Recolher' : 'Expandir'} seção Configurações`}
              className="w-full flex items-center justify-between px-2 py-2 mt-2 text-xs font-semibold text-texto-suave dark:text-texto-suave-dark uppercase tracking-wider rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-medio dark:hover:text-texto-medio transition-colors"
            >
              <span>Configurações</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isSettingsSectionOpen ? '' : '-rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          )}
          <div
            id="settings-navigation-items"
            aria-hidden={!isSettingsSubmenuVisible}
            inert={!isSettingsSubmenuVisible}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
              isSettingsSubmenuVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-1">
                {bottomItems.map((item) => {
              const active = isNavActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  title={isClosed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isClosed ? 'justify-center px-2' : 'px-2.5'
                  } py-2 text-sm font-medium rounded-[var(--radius-controle)] transition-colors ${
                    active
                      ? 'bg-primaria-suave dark:bg-navy-claro text-primaria dark:text-primaria-clara font-semibold'
                      : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/80 hover:text-texto-forte dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      active ? 'text-primaria dark:text-primaria-clara' : 'text-texto-suave dark:text-texto-suave-dark'
                    } ${!isClosed ? 'mr-3' : ''}`}
                  />
                  {!isClosed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                </button>
              );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isClosed && activeCollapsedGroup && activeCollapsedMenu && (
        <nav
          id={`collapsed-menu-${activeCollapsedMenu}`}
          aria-label={`Menu ${activeCollapsedGroup.label}`}
          className="absolute left-full top-20 z-40 ml-3 w-64 overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie shadow-xl dark:border-borda-dark dark:bg-superficie-dark"
        >
          <div className="flex items-center justify-between border-b border-borda px-4 py-3 dark:border-borda-dark">
            <span className="text-sm font-semibold text-texto-forte dark:text-texto-forte-dark">{activeCollapsedGroup.label}</span>
            <button
              type="button"
              aria-label={`Fechar menu ${activeCollapsedGroup.label}`}
              onClick={() => setActiveCollapsedMenu(null)}
              className="rounded-[var(--radius-controle)] p-1 text-texto-suave transition-colors hover:bg-fundo-sutil hover:text-texto focus:outline-none focus-visible:ring-2 focus-visible:ring-primaria dark:hover:bg-fundo-sutil dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-7rem)] space-y-1 overflow-y-auto p-2">
            {activeCollapsedGroup.items.map((item) => {
              const active = isNavActive(item.id);
              const Icon = item.icon;
              const unavailable = (item as { unavailable?: boolean }).unavailable === true;
              const badgeText = (item as { badgeText?: string }).badgeText;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={unavailable}
                  aria-disabled={unavailable}
                  onClick={() => {
                    if (!unavailable) {
                      onNavigate(item.id);
                      setActiveCollapsedMenu(null);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius-controle)] px-2.5 py-2 text-sm font-medium transition-colors ${
                    unavailable
                      ? 'cursor-not-allowed text-texto-suave opacity-70 dark:text-texto-medio-dark'
                      : active
                        ? 'bg-primaria-suave text-primaria dark:bg-navy-claro dark:text-primaria-clara'
                        : 'text-texto-medio hover:bg-fundo-sutil hover:text-texto-forte dark:text-texto-medio-dark dark:hover:bg-fundo-sutil/80 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      unavailable
                        ? 'text-texto-suave dark:text-texto-medio-dark'
                        : active
                          ? 'text-primaria dark:text-primaria-clara'
                          : 'text-texto-suave dark:text-texto-suave-dark'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {badgeText && (
                    <span className="rounded-[var(--radius-controle)] border border-primaria bg-primaria-suave px-1.5 py-0.5 text-[10px] font-bold text-primaria dark:border-borda-dark/60 dark:bg-navy-claro/50 dark:text-primaria-clara">
                      {badgeText}
                    </span>
                  )}
                  {unavailable && (
                    <span className="rounded-[var(--radius-controle)] border border-alerta bg-alerta-suave px-1.5 py-0.5 text-[10px] font-semibold text-alerta dark:border-borda-dark/50 dark:bg-superficie-dark/40 dark:text-texto-forte-dark">
                      Em construção
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* User profile footer matching Clean Minimalism theme */}
      <div className="p-4 border-t border-borda dark:border-borda-dark">
        <div className="flex items-center gap-3 p-2 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/70 border border-borda/80 dark:border-borda-dark">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-primaria flex items-center justify-center text-white font-semibold text-xs shadow-sutil shrink-0">
            MR
          </div>
          {!isClosed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-texto-forte dark:text-texto-forte-dark truncate">Marlon Ribeiro</p>
              <p className="text-[10px] text-texto-medio dark:text-texto-suave-dark truncate">Dubbo Marketing · Pro</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
