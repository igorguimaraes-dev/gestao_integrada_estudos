import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Search,
  RotateCw,
  Bell,
  Plus,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus,
  FilePlus,
  Receipt,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { RouteId } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface TopbarProps {
  currentRoute: RouteId;
  clientDetailName?: string;
  contractDetailCode?: string;
  onNavigate: (route: RouteId) => void;
  onToggleSidebar: () => void;
  onOpenCommand: () => void;
  onOpenQuickCreate: (type?: string) => void;
  hideValues: boolean;
  onToggleHideValues: () => void;
  onManualSync: () => void;
  isManualSyncing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentRoute,
  clientDetailName,
  contractDetailCode,
  onNavigate,
  onToggleSidebar,
  onOpenCommand,
  onOpenQuickCreate,
  hideValues,
  onToggleHideValues,
  onManualSync,
  isManualSyncing = false,
}) => {
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [showNovoMenu, setShowNovoMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const periodSelectorRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const anoCalendario = calendarCursor.getFullYear();
  const mesCalendario = calendarCursor.getMonth();
  const totalDiasCalendario = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
  const primeiroDiaCalendario = new Date(anoCalendario, mesCalendario, 1).getDay();
  const anosDisponiveis = Array.from({ length: 11 }, (_, indice) => anoCalendario - 5 + indice);
  const selectedPeriod = `${nomesMeses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;

  const selecionarMes = (data: Date) => {
    const competencia = new Date(data.getFullYear(), data.getMonth(), 1);
    setCalendarCursor(competencia);
    setSelectedDate(data);
    window.dispatchEvent(new CustomEvent('gestao-financeiro-periodo', {
      detail: `${nomesMeses[competencia.getMonth()]} de ${competencia.getFullYear()}`,
    }));
  };

  const navegarMes = (direcao: number) => {
    selecionarMes(new Date(anoCalendario, mesCalendario + direcao, 1));
  };

  const alterarMesOuAno = (mes: number, ano: number) => {
    selecionarMes(new Date(ano, mes, 1));
  };

  useEffect(() => {
    if (!showPeriodDropdown) return;
    const fecharAoClicarFora = (event: MouseEvent) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
    };
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPeriodDropdown(false);
    };
    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [showPeriodDropdown]);

  useEffect(() => {
    if (!showNotifications) return;
    const fecharAoClicarFora = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [showNotifications]);

  const getBreadcrumbs = () => {
    switch (currentRoute) {
      case 'dashboard':
        return [
          { label: 'Início', onClick: () => onNavigate('dashboard') },
          { label: 'Dashboard executivo', active: true },
        ];
      case 'acoes':
        return [
          { label: 'Início', onClick: () => onNavigate('dashboard') },
          { label: 'Central do dia', active: true },
        ];
      case 'pipeline':
        return [
          { label: 'Comercial', onClick: () => onNavigate('pipeline') },
          { label: 'Pipeline de vendas', active: true },
        ];
      case 'clientes':
        return [
          { label: 'Clientes', onClick: () => onNavigate('clientes') },
          { label: 'Todos os clientes', active: true },
        ];
      case 'cliente-detalhe':
        return [
          { label: 'Clientes', onClick: () => onNavigate('clientes') },
          { label: clientDetailName || 'Detalhes do cliente', active: true },
        ];
      case 'contratos':
        return [
          { label: 'Contratos', onClick: () => onNavigate('contratos') },
          { label: 'Gestão de contratos', active: true },
        ];
      case 'contrato-detalhe':
        return [
          { label: 'Contratos', onClick: () => onNavigate('contratos') },
          { label: contractDetailCode || 'Contrato', active: true },
        ];
      case 'financeiro':
        return [
          { label: 'Financeiro', onClick: () => onNavigate('financeiro') },
          { label: 'Visão geral de caixa', active: true },
        ];
      case 'financeiro-pagar':
        return [
          { label: 'Financeiro', onClick: () => onNavigate('financeiro') },
          { label: 'Contas a pagar', active: true },
        ];
      case 'conciliacao':
        return [
          { label: 'Financeiro', onClick: () => onNavigate('financeiro') },
          { label: 'Conciliação Bancária IA', active: true },
        ];
      case 'assistente-ia':
        return [
          { label: 'Início', onClick: () => onNavigate('dashboard') },
          { label: 'Copiloto IA & Educador', active: true },
        ];
      case 'integracoes':
      case 'integracao-detalhe':
        return [
          { label: 'Configurações', onClick: () => onNavigate('configuracoes') },
          { label: 'Integrações e APIs', active: true },
        ];
      default:
        return [{ label: 'Gestão Integrada', active: true }];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header
      id="global-topbar"
      className="h-16 bg-superficie dark:bg-superficie-dark border-b border-borda dark:border-borda-dark px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-sutil transition-colors duration-200"
    >
      {/* Left: Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          className="p-1.5 text-texto-medio hover:text-texto-forte dark:text-texto-suave-dark dark:hover:text-white hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors"
          title="Recolher / Expandir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center text-sm text-texto-medio dark:text-texto-suave-dark">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="mx-2 text-texto-medio dark:text-texto-medio-dark">/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="hover:text-texto-forte dark:hover:text-white transition-colors font-medium"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-semibold text-texto-forte dark:text-texto-forte-dark">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Input */}
        <button
          id="btn-global-search"
          onClick={onOpenCommand}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-fundo-sutil dark:bg-superficie-dark/80 hover:bg-fundo-sutil/70 dark:hover:bg-fundo-sutil/80 border border-borda dark:border-borda-dark rounded-[var(--radius-controle)] text-xs text-texto-medio dark:text-texto-medio-dark transition-all w-40 md:w-56 text-left group"
        >
          <Search className="w-3.5 h-3.5 text-texto-suave group-hover:text-primaria dark:group-hover:text-primaria transition-colors" />
          <span className="flex-1 truncate">Buscar clientes, contratos...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-texto-medio dark:text-texto-medio-dark bg-superficie dark:bg-superficie-dark rounded border border-borda dark:border-borda-dark shadow-sutil">
            ⌘K
          </kbd>
        </button>

        {/* Copiloto IA Quick Launcher */}
        <button
          id="btn-topbar-copiloto-ia"
          disabled
          aria-disabled="true"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark text-texto-suave dark:text-texto-medio-dark border border-borda dark:border-borda-dark text-xs font-semibold cursor-not-allowed opacity-80"
          title="Copiloto IA — Em construção"
        >
          <Sparkles className="w-3.5 h-3.5 text-texto-suave dark:text-texto-medio-dark" />
          <span className="hidden sm:inline">Copiloto IA</span>
          <span className="hidden lg:inline text-[10px] text-alerta dark:text-texto-forte-dark">Em construção</span>
        </button>

        {/* Period Selector */}
        <div ref={periodSelectorRef} className="relative hidden md:block">
          <button
            id="btn-period-selector"
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-texto dark:text-texto-medio-dark bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/60 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-texto-medio dark:text-texto-suave-dark" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3 h-3 text-texto-suave dark:text-texto-suave-dark" />
          </button>

          {showPeriodDropdown && (
            <div className="absolute right-0 mt-2 w-[344px] rounded-2xl border border-borda bg-superficie p-4 shadow-xl dark:border-borda-dark dark:bg-superficie-dark z-50 text-xs text-texto dark:text-texto-medio-dark">
              <div className="mb-4 flex items-center justify-between gap-2">
                <button type="button" onClick={() => navegarMes(-1)} className="rounded-[var(--radius-controle)] p-2 text-texto-medio transition-colors hover:bg-primaria-suave hover:text-primaria dark:text-texto-suave-dark dark:hover:bg-primaria-suave/40 dark:hover:text-primaria" aria-label="Mês anterior">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <select aria-label="Mês" value={mesCalendario} onChange={(event) => alterarMesOuAno(Number(event.target.value), anoCalendario)} className="min-w-0 flex-1 rounded-[var(--radius-controle)] border border-borda bg-superficie px-2 py-1.5 text-center text-xs font-semibold text-texto-medio outline-none focus:border-primaria dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-forte-dark">
                    {nomesMeses.map((mes, indice) => <option key={mes} value={indice}>{mes}</option>)}
                  </select>
                  <select aria-label="Ano" value={anoCalendario} onChange={(event) => alterarMesOuAno(mesCalendario, Number(event.target.value))} className="w-[82px] rounded-[var(--radius-controle)] border border-borda bg-superficie px-1 py-1.5 text-center text-xs font-semibold text-texto-medio outline-none focus:border-primaria dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-forte-dark">
                    {anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => navegarMes(1)} className="rounded-[var(--radius-controle)] p-2 text-texto-medio transition-colors hover:bg-primaria-suave hover:text-primaria dark:text-texto-suave-dark dark:hover:bg-primaria-suave/40 dark:hover:text-primaria" aria-label="Próximo mês">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {diasSemana.map((dia, indice) => <span key={`${dia}-${indice}`} className="pb-1 text-[10px] font-bold text-texto-suave dark:text-texto-medio-dark">{dia}</span>)}
                {Array.from({ length: primeiroDiaCalendario }, (_, indice) => <span key={`vazio-${indice}`} />)}
                {Array.from({ length: totalDiasCalendario }, (_, indice) => {
                  const dia = indice + 1;
                  const data = new Date(anoCalendario, mesCalendario, dia);
                  const estaSelecionado = selectedDate.getFullYear() === anoCalendario && selectedDate.getMonth() === mesCalendario && selectedDate.getDate() === dia;
                  const hoje = new Date();
                  const ehHoje = hoje.getFullYear() === anoCalendario && hoje.getMonth() === mesCalendario && hoje.getDate() === dia;
                  return (
                    <button type="button" key={dia} onClick={() => { selecionarMes(data); setShowPeriodDropdown(false); }} aria-label={`Selecionar ${dia} de ${nomesMeses[mesCalendario]} de ${anoCalendario}`} className={`h-9 rounded-[var(--radius-controle)] text-xs font-medium transition-colors ${estaSelecionado ? 'bg-primaria text-white shadow-card' : ehHoje ? 'border border-primaria text-primaria hover:bg-primaria-suave dark:border-borda-dark dark:text-primaria-clara dark:hover:bg-primaria-suave/40' : 'text-texto hover:bg-primaria-suave hover:text-primaria dark:text-texto-medio-dark dark:hover:bg-primaria-suave/40 dark:hover:text-primaria'}`}>
                      {dia}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => { selecionarMes(new Date()); setShowPeriodDropdown(false); }} className="mt-4 w-full rounded-[var(--radius-controle)] border border-primaria py-2 text-xs font-semibold text-primaria transition-colors hover:bg-primaria-suave dark:border-borda-dark dark:text-primaria-clara dark:hover:bg-primaria-suave/40">
                Ir para hoje
              </button>
            </div>
          )}
        </div>

        {/* Sync Status Badge */}
        <button
          id="btn-sync-status"
          onClick={onManualSync}
          disabled={isManualSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sucesso dark:text-texto-forte-dark bg-sucesso-suave dark:bg-superficie-dark/40 border border-sucesso dark:border-borda-dark rounded-[var(--radius-controle)] hover:bg-sucesso-suave/70 dark:hover:bg-sucesso-suave/40 transition-colors disabled:cursor-wait disabled:opacity-70"
          title="Forçar sincronização com o Asaas"
        >
          <RotateCw className={`w-3.5 h-3.5 text-sucesso dark:text-texto-forte-dark ${isManualSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isManualSyncing ? 'Sincronizando...' : 'Sincronizar Asaas'}</span>
        </button>

        {/* Hide/Show Financial Values */}
        <button
          id="btn-toggle-hide-values"
          onClick={onToggleHideValues}
          className="p-2 text-texto-medio hover:text-texto-forte dark:text-texto-suave-dark dark:hover:text-white hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors border border-transparent"
          title={hideValues ? 'Mostrar valores financeiros' : 'Ocultar valores para privacidade'}
        >
          {hideValues ? <EyeOff className="w-4 h-4 text-primaria dark:text-primaria-clara" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Theme Selector (ThemeContext) */}
        <ThemeToggle />

        {/* Notifications Bell */}
        <div ref={notificationsRef} className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-texto-medio hover:text-texto-forte dark:text-texto-suave-dark dark:hover:text-white hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors relative border border-transparent"
          >
            <Bell className="w-4 h-4" />
            {!notificationsRead && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-perigo-suave0 ring-2 ring-white dark:ring-borda-dark"></span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark rounded-[var(--radius-card)] shadow-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-borda dark:border-borda-dark">
                <span className="font-semibold text-texto-forte dark:text-texto-forte-dark">Notificações</span>
                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  disabled={notificationsRead}
                  className="text-[11px] text-primaria dark:text-primaria-clara hover:underline disabled:cursor-default disabled:text-texto-suave disabled:no-underline"
                >
                  {notificationsRead ? 'Todas lidas' : 'Marcar como lidas'}
                </button>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2.5 rounded-[var(--radius-controle)] bg-perigo-suave dark:bg-superficie-dark/30 border border-perigo dark:border-borda-dark/50 flex gap-2.5">
                  {!notificationsRead && <div className="w-2 h-2 rounded-full bg-perigo-suave0 mt-1 shrink-0" />}
                  <div>
                    <div className="font-semibold text-perigo dark:text-texto-forte-dark">Cobrança vencida (R$ 2.450)</div>
                    <div className="text-perigo dark:text-texto-forte-dark text-[11px]">Aurora Marketing - Boleto Asaas vencido há 3 dias.</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/30 border border-primaria dark:border-borda-dark/50 flex gap-2.5">
                  {!notificationsRead && <div className="w-2 h-2 rounded-full bg-primaria-suave0 mt-1 shrink-0" />}
                  <div>
                    <div className="font-semibold text-primaria dark:text-primaria-clara">Contrato aguardando assinatura</div>
                    <div className="text-primaria dark:text-primaria-clara text-[11px]">Costa Consultoria aguarda revisão interna.</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-[var(--radius-controle)] bg-sucesso-suave dark:bg-superficie-dark/30 border border-sucesso dark:border-borda-dark/50 flex gap-2.5">
                  {!notificationsRead && <div className="w-2 h-2 rounded-full bg-sucesso-suave0 mt-1 shrink-0" />}
                  <div>
                    <div className="font-semibold text-sucesso dark:text-texto-forte-dark">Pix confirmado no Asaas</div>
                    <div className="text-sucesso dark:text-texto-forte-dark text-[11px]">Nexus Corp pagou NF-e 2026-0091 (R$ 18.000).</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contextual "+ Novo" Button matching Clean Minimalism */}
        <div className="relative">
          <button
            id="btn-global-novo"
            disabled
            aria-disabled="true"
            title="Ações rápidas — Em construção"
            className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark text-texto-suave dark:text-texto-medio-dark border border-borda dark:border-borda-dark text-sm font-medium cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
            <span className="hidden lg:inline text-[10px] text-alerta dark:text-texto-forte-dark">Em construção</span>
          </button>

          {showNovoMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark rounded-[var(--radius-card)] shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-texto-suave dark:text-texto-suave-dark">
                Ações Rápidas
              </div>
              <button
                onClick={() => {
                  setShowNovoMenu(false);
                  onOpenQuickCreate('cliente');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-texto dark:text-texto-medio-dark hover:bg-primaria-suave dark:hover:bg-primaria-suave/40 hover:text-primaria dark:hover:text-primaria transition-colors text-left"
              >
                <UserPlus className="w-4 h-4 text-texto-suave dark:text-texto-suave-dark" />
                <span>Novo cliente</span>
              </button>
              <button
                onClick={() => {
                  setShowNovoMenu(false);
                  onOpenQuickCreate('contrato');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-texto dark:text-texto-medio-dark hover:bg-primaria-suave dark:hover:bg-primaria-suave/40 hover:text-primaria dark:hover:text-primaria transition-colors text-left"
              >
                <FilePlus className="w-4 h-4 text-texto-suave dark:text-texto-suave-dark" />
                <span>Novo contrato</span>
              </button>
              <button
                onClick={() => {
                  setShowNovoMenu(false);
                  onOpenQuickCreate('cobranca');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-texto dark:text-texto-medio-dark hover:bg-primaria-suave dark:hover:bg-primaria-suave/40 hover:text-primaria dark:hover:text-primaria transition-colors text-left"
              >
                <Receipt className="w-4 h-4 text-texto-suave dark:text-texto-suave-dark" />
                <span>Nova cobrança (Asaas)</span>
              </button>
              <button
                onClick={() => {
                  setShowNovoMenu(false);
                  onOpenQuickCreate('proposta');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-texto dark:text-texto-medio-dark hover:bg-primaria-suave dark:hover:bg-primaria-suave/40 hover:text-primaria dark:hover:text-primaria transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-texto-suave dark:text-texto-suave-dark" />
                <span>Nova oportunidade / lead</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
