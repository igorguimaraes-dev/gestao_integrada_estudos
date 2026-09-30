import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  UserCheck,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Filter,
  DollarSign,
  FileText,
  Briefcase,
  Layers,
  Plug,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  ListFilter,
  CheckSquare,
  Tag,
  Eye,
  SlidersHorizontal,
  X,
  Building,
  User,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { ActionItem, Client, Contract, RouteId } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';

interface CentralDoDiaViewProps {
  actionItems?: ActionItem[];
  clients?: Client[];
  contracts?: Contract[];
  onTriggerAction?: (item: ActionItem) => void;
  onNavigate?: (route: RouteId) => void;
  onSelectClient?: (client: Client) => void;
  onSelectContract?: (contract: Contract) => void;
  hideValues?: boolean;
}

type ViewMode = 'calendar' | 'week' | 'list';
type TitleOption = 'agenda' | 'calendario' | 'central' | 'planejamento';

const TITLE_LABELS: Record<TitleOption, { title: string; subtitle: string; badge: string }> = {
  agenda: {
    title: 'Agenda & Calendário',
    subtitle: 'Acompanhamento cronológico de prazos, compromissos, cobranças e ações operacionais.',
    badge: 'Visão Cronológica',
  },
  calendario: {
    title: 'Calendário Operacional',
    subtitle: 'Grade mensal e semanal com todos os compromissos, vencimentos de clientes e rotinas.',
    badge: 'Planejamento Mensal',
  },
  central: {
    title: 'Central do Dia',
    subtitle: 'O que exige atenção imediata na agência sem precisar navegar por dezenas de menus.',
    badge: 'Pendências Críticas',
  },
  planejamento: {
    title: 'Planejamento de Ações & Prazos',
    subtitle: 'Distribuição temporal de tarefas, lembretes de cobrança e marcos contratuais.',
    badge: 'Operação Ágil',
  },
};

// Seed additional calendar appointments so the month of September 2026 is rich and active
const additionalCalendarEvents: ActionItem[] = [
  {
    id: 'cal-ev-1',
    priority: 'media',
    category: 'financeiro',
    title: 'Vencimento Cobrança Clínica Vitta (R$ 3.800)',
    description: 'Mensalidade via Pix Asaas com emissão automática de NFS-e.',
    value: 3800,
    dueDate: '05/09/2026',
    clientId: 'cli-vitta',
    clientName: 'Clínica Vitta',
    responsible: 'Helena Duarte',
    actionType: 'lembrete_cobranca',
    completed: true,
  },
  {
    id: 'cal-ev-2',
    priority: 'alta',
    category: 'comercial',
    title: 'Reunião de Alinhamento de Metas Q3/Q4',
    description: 'Alinhamento estratégico com o comitê de novos negócios e expansão de contas.',
    dueDate: '07/09/2026',
    responsible: 'Marlon Ribeiro',
    actionType: 'reuniao',
  },
  {
    id: 'cal-ev-3',
    priority: 'media',
    category: 'financeiro',
    title: 'Vencimento Parcela Costa Consultoria (R$ 4.500)',
    description: 'Boleto Asaas referente à parcela inicial de expansão de contrato.',
    value: 4500,
    dueDate: '10/09/2026',
    clientId: 'cli-costa',
    clientName: 'Costa Consultoria',
    responsible: 'Marlon Ribeiro',
    actionType: 'lembrete_cobranca',
  },
  {
    id: 'cal-ev-4',
    priority: 'media',
    category: 'financeiro',
    title: 'Fechamento Quinzena & Emissão Lote NFS-e',
    description: 'Auditar conciliação bancária do Asaas e fechar conciliações tributárias.',
    dueDate: '15/09/2026',
    responsible: 'Helena Duarte',
    actionType: 'sincronizacao',
  },
  {
    id: 'cal-ev-5',
    priority: 'alta',
    category: 'financeiro',
    title: 'Recebimento Studio Horizonte (R$ 11.400)',
    description: 'Maior mensalidade da carteira com agendamento via Pix dinâmico.',
    value: 11400,
    dueDate: '15/09/2026',
    clientId: 'cli-horizonte',
    clientName: 'Studio Horizonte',
    responsible: 'Marlon Ribeiro',
    actionType: 'lembrete_cobranca',
  },
  {
    id: 'cal-ev-6',
    priority: 'media',
    category: 'comercial',
    title: 'Apresentação de Proposta BioNutri Alimentos',
    description: 'Reunião virtual de alinhamento com André Bastos para projeto de R$ 14.500.',
    value: 14500,
    dueDate: '16/09/2026',
    clientName: 'BioNutri Alimentos',
    responsible: 'Marlon Ribeiro',
    actionType: 'retorno_proposta',
  },
  {
    id: 'cal-ev-7',
    priority: 'media',
    category: 'financeiro',
    title: 'Vencimento DAS Simples Nacional',
    description: 'Pagamento da guia única de tributos federais e municipais do mês anterior.',
    value: 4820,
    dueDate: '20/09/2026',
    responsible: 'Helena Duarte',
    actionType: 'pagamento',
  },
  {
    id: 'cal-ev-8',
    priority: 'media',
    category: 'financeiro',
    title: 'Vencimento Alpha Tecnologia (R$ 8.500)',
    description: 'Cobrança via cartão corporativo recorrente Asaas.',
    value: 8500,
    dueDate: '20/09/2026',
    clientId: 'cli-alpha',
    clientName: 'Alpha Tecnologia',
    responsible: 'Marlon Ribeiro',
    actionType: 'lembrete_cobranca',
  },
  {
    id: 'cal-ev-9',
    priority: 'urgente',
    category: 'contratos',
    title: 'Renovação Anual de Contrato - Exclusive Motors',
    description: 'Encerramento de vigência do contrato CON-2025-0019. Reajuste IPCA + proposta enviada.',
    value: 5900,
    dueDate: '30/09/2026',
    clientId: 'cli-exclusive',
    clientName: 'Exclusive Motors',
    responsible: 'Marlon Ribeiro',
    actionType: 'renovacao',
  },
];

export const CentralDoDiaView: React.FC<CentralDoDiaViewProps> = ({
  actionItems = [],
  clients = [],
  contracts = [],
  onTriggerAction = (_item: ActionItem) => {},
  onNavigate = (_route: RouteId) => {},
  onSelectClient = (_client: Client) => {},
  onSelectContract = (_contract: Contract) => {},
  hideValues = false,
}) => {
  // Title choice state (allowing user to select how they want to name this view)
  const [titleName, setTitleName] = useState<TitleOption>('agenda');
  const [showTitlePicker, setShowTitlePicker] = useState(false);

  // View presentation mode (Calendar Monthly / Weekly / Classic List)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Calendar month state (defaults to September 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(8); // 8 = Setembro (0-indexed)

  // Selected date in calendar (defaults to Today: 2026-09-07)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-07');

  // Master action list combining incoming props and rich calendar items
  const [items, setItems] = useState<ActionItem[]>(() => {
    const combined = [...(actionItems || [])];
    // Add additional calendar events if not already present
    additionalCalendarEvents.forEach((ev) => {
      if (!combined.some((c) => c.id === ev.id)) {
        combined.push(ev);
      }
    });
    return combined;
  });

  // New Event Modal State
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'financeiro' | 'contratos' | 'comercial' | 'integracoes'>('financeiro');
  const [newEventPriority, setNewEventPriority] = useState<'urgente' | 'alta' | 'media' | 'baixa'>('alta');
  const [newEventDate, setNewEventDate] = useState('2026-09-07');
  const [newEventClientId, setNewEventClientId] = useState('');
  const [newEventValue, setNewEventValue] = useState('');
  const [newEventResponsible, setNewEventResponsible] = useState('Marlon Ribeiro');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Categories definition
  const categories = [
    { id: 'todos', label: 'Tudo', icon: Layers, count: (items || []).filter((i) => !i.completed).length },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      count: (items || []).filter((i) => i.category === 'financeiro' && !i.completed).length,
    },
    {
      id: 'contratos',
      label: 'Contratos',
      icon: FileText,
      count: (items || []).filter((i) => i.category === 'contratos' && !i.completed).length,
    },
    {
      id: 'comercial',
      label: 'Comercial',
      icon: Briefcase,
      count: (items || []).filter((i) => i.category === 'comercial' && !i.completed).length,
    },
    {
      id: 'integracoes',
      label: 'Integrações',
      icon: Plug,
      count: (items || []).filter((i) => i.category === 'integracoes' && !i.completed).length,
    },
  ];

  // Helper to normalize any item's dueDate to a standard YYYY-MM-DD
  const normalizeDate = (dueDate?: string): string => {
    if (!dueDate) return '2026-09-07';
    if (dueDate.toLowerCase() === 'hoje') return '2026-09-07';

    // Matches DD/MM/YYYY
    const parts = dueDate.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // Matches YYYY-MM-DD
    if (dueDate.includes('-')) return dueDate;

    return '2026-09-07';
  };

  const handleToggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it))
    );
  };

  const handleOpenClient = (clientId?: string) => {
    if (!clientId) return;
    const found = clients.find((c) => c.id === clientId);
    if (found) onSelectClient(found);
  };

  // Filter items by category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory === 'todos') return true;
      return item.category === selectedCategory;
    });
  }, [items, selectedCategory]);

  // Map of normalizedDate -> ActionItem[]
  const itemsByDate = useMemo(() => {
    const map: Record<string, ActionItem[]> = {};
    filteredItems.forEach((item) => {
      const key = normalizeDate(item.dueDate);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filteredItems]);

  // Calendar matrix calculation for current month
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const calendarDays = useMemo(() => {
    const year = currentYear;
    const month = currentMonthIndex; // 0-indexed

    // First day of month
    const firstDay = new Date(year, month, 1);
    // 0 = Sunday, 1 = Monday, ...
    const startingDayOfWeek = firstDay.getDay();

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      items: ActionItem[];
    }> = [];

    // Fill days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-07',
        isSelected: dateStr === selectedDateStr,
        items: itemsByDate[dateStr] || [],
      });
    }

    // Fill days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === '2026-09-07',
        isSelected: dateStr === selectedDateStr,
        items: itemsByDate[dateStr] || [],
      });
    }

    // Fill remaining cells to complete 35 or 42 grid slots
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === '2026-09-07',
        isSelected: dateStr === selectedDateStr,
        items: itemsByDate[dateStr] || [],
      });
    }

    return days;
  }, [currentYear, currentMonthIndex, selectedDateStr, itemsByDate]);

  // Selected date details
  const selectedDayItems = useMemo(() => {
    return itemsByDate[selectedDateStr] || [];
  }, [itemsByDate, selectedDateStr]);

  const selectedDateFormatted = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      const d = new Date(parseInt(year, 10), month, day);
      const weekDayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return {
        weekday: weekDayNames[d.getDay()],
        day,
        monthName: monthNames[month],
        year,
        isToday: selectedDateStr === '2026-09-07',
      };
    }
    return {
      weekday: 'Segunda-feira',
      day: 7,
      monthName: 'Setembro',
      year: '2026',
      isToday: true,
    };
  }, [selectedDateStr, monthNames]);

  // Week days view calculation (for current week around selectedDate)
  const currentWeekDays = useMemo(() => {
    const target = new Date(selectedDateStr + 'T12:00:00');
    const dayOfWeek = target.getDay(); // 0 is Sun
    const startOfWeek = new Date(target);
    startOfWeek.setDate(target.getDate() - dayOfWeek);

    const week = [];
    const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      week.push({
        dateStr,
        weekday: weekDayNames[i],
        dayNumber: current.getDate(),
        isToday: dateStr === '2026-09-07',
        isSelected: dateStr === selectedDateStr,
        items: itemsByDate[dateStr] || [],
      });
    }
    return week;
  }, [selectedDateStr, itemsByDate]);

  // Calendar navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(2026);
    setCurrentMonthIndex(8); // Setembro
    setSelectedDateStr('2026-09-07');
  };

  // Add new event handler
  const handleSaveNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const matchedClient = clients.find((c) => c.id === newEventClientId);

    const newItem: ActionItem = {
      id: `act-custom-${Date.now()}`,
      title: newEventTitle.trim(),
      dueDate: newEventDate.split('-').reverse().join('/'),
      category: newEventCategory,
      priority: newEventPriority,
      description: newEventDesc.trim() || 'Compromisso agendado no calendário operacional.',
      responsible: newEventResponsible,
      value: newEventValue ? parseFloat(newEventValue) : undefined,
      clientId: newEventClientId || undefined,
      clientName: matchedClient?.name || undefined,
      actionType: 'geral',
      completed: false,
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedDateStr(newEventDate);
    setIsNewEventModalOpen(false);

    // Reset fields
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventValue('');
  };

  // Summary Metrics
  const totalPending = items.filter((i) => !i.completed).length;
  const urgentCount = items.filter((i) => i.priority === 'urgente' && !i.completed).length;
  const todayCount = (itemsByDate['2026-09-07'] || []).filter((i) => !i.completed).length;

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header with Title Switcher & Quick Navigation */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-superficie p-5 rounded-2xl border border-borda shadow-sutil">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 flex-wrap">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-10 h-10 rounded-[var(--radius-card)] bg-primaria-suave text-primaria flex items-center justify-center font-bold shadow-sutil">
              <CalendarIcon className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 text-primaria" />
            </div>

            <div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-texto-medio tracking-tight">
                  {TITLE_LABELS[titleName].title}
                </h1>

                {/* Name Selector Menu Trigger */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative">
                  <button
                    onClick={() => setShowTitlePicker(!showTitlePicker)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-texto-medio hover:bg-fundo-sutil rounded-md transition-colors"
                    title="Alternar nome deste módulo"
                  >
                    <SlidersHorizontal className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                  </button>

                  {showTitlePicker && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute left-0 top-full mt-1.5 w-64 bg-superficie rounded-[var(--radius-card)] shadow-xl border border-borda p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-texto-medio">
                        Nome de Exibição Preferido
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1 mt-1">
                        {(Object.keys(TITLE_LABELS) as TitleOption[]).map((key) => (
                          <button
                            key={key}
                            onClick={() => {
                              setTitleName(key);
                              setShowTitlePicker(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-[var(--radius-controle)] text-xs font-medium flex items-center justify-between transition-colors ${
                              titleName === key
                                ? 'bg-primaria-suave text-primaria font-semibold'
                                : 'text-texto-medio hover:bg-fundo-sutil'
                            }`}
                          >
                            <span>{TITLE_LABELS[key].title}</span>
                            {titleName === key && <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-primaria" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primaria-suave text-primaria border border-primaria">
                  {TITLE_LABELS[titleName].badge}
                </span>

                {urgentCount > 0 && (
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-xs font-semibold bg-perigo-suave text-perigo border border-perigo flex items-center gap-1">
                    <AlertTriangle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-perigo" />
                    {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-0.5">
                {TITLE_LABELS[titleName].subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Add Button */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5 flex-wrap">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex rounded-[var(--radius-card)] border border-borda p-1 bg-fundo-sutil/80 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-superficie text-texto-medio shadow-sutil font-semibold'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <CalendarDays className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Calendário Mensal</span>
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-superficie text-texto-medio shadow-sutil font-semibold'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Visão Semanal</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-superficie text-texto-medio shadow-sutil font-semibold'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <ListFilter className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Lista de Ações</span>
            </button>
          </div>

          <button
            onClick={() => {
              setNewEventDate(selectedDateStr);
              setIsNewEventModalOpen(true);
            }}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-card)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold shadow-sutil transition-colors"
          >
            <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Novo Compromisso</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3.5 bg-superficie border border-borda rounded-[var(--radius-card)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio">Pendências Totais</span>
            <CheckSquare className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-primaria" />
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-texto-medio mt-1">{totalPending} ativas</div>
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Na carteira e rotinas</span>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3.5 bg-superficie border border-borda rounded-[var(--radius-card)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio">Agendados para Hoje</span>
            <CalendarIcon className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-primaria" />
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-primaria mt-1">{todayCount} itens</div>
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">07 de Setembro de 2026</span>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3.5 bg-superficie border border-borda rounded-[var(--radius-card)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio">Ações Urgentes</span>
            <AlertTriangle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-perigo" />
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-perigo mt-1">{urgentCount} atrasadas</div>
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-perigo">Exigem cobrança imediata</span>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3.5 bg-superficie border border-borda rounded-[var(--radius-card)] shadow-sutil">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio">Resolvidas no Mês</span>
            <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-sucesso" />
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold text-sucesso mt-1">
            {items.filter((i) => i.completed).length} concluídas
          </div>
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-sucesso">Histórico mantido</span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 overflow-x-auto pb-1">
        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio uppercase tracking-wider pl-1 shrink-0">
          Filtrar:
        </span>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-medium shrink-0 transition-all ${
                isSelected
                  ? 'bg-primaria text-white shadow-sutil'
                  : 'bg-superficie border border-borda text-texto-medio hover:bg-fundo-sutil'
              }`}
            >
              <Icon className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-superficie/25 text-white' : 'bg-fundo-sutil text-texto-medio'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: CALENDÁRIO MENSAL (Interativo em Formato de Grade de Calendário) */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Month Calendar Grid (2 Cols) */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark lg:col-span-2 bg-superficie rounded-2xl border border-borda shadow-sutil p-5 space-y-4">
            {/* Calendar Controls */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between border-b border-borda pb-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio capitalize">
                  {monthNames[currentMonthIndex]} {currentYear}
                </h2>
                <button
                  onClick={handleGoToToday}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 text-[11px] font-semibold text-primaria bg-primaria-suave hover:bg-primaria-suave rounded-[var(--radius-controle)] border border-primaria transition-colors"
                >
                  Hoje (07/09)
                </button>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] border border-borda hover:bg-fundo-sutil text-texto-medio transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1.5 rounded-[var(--radius-controle)] border border-borda hover:bg-fundo-sutil text-texto-medio transition-colors"
                  title="Próximo mês"
                >
                  <ChevronRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Names */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-7 gap-1 text-center text-xs font-semibold text-texto-medio py-1 uppercase tracking-wider">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>

            {/* Days Grid */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                const hasUrgent = day.items.some((i) => i.priority === 'urgente' && !i.completed);
                const hasPending = day.items.some((i) => !i.completed);
                const isSelected = day.isSelected;
                const isToday = day.isToday;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[92px] p-1.5 rounded-[var(--radius-card)] border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primaria bg-primaria-suave/40 ring-2 ring-primaria/20'
                        : isToday
                        ? 'border-primaria bg-primaria-suave/30 hover:border-primaria'
                        : day.isCurrentMonth
                        ? 'border-borda bg-superficie hover:border-borda-forte hover:bg-fundo-sutil/50'
                        : 'border-transparent bg-fundo-sutil/40 opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-primaria-suave text-white shadow-sutil'
                            : isSelected
                            ? 'bg-primaria text-white'
                            : day.isCurrentMonth
                            ? 'text-texto-medio'
                            : 'text-texto-medio'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {hasUrgent && (
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-perigo-suave0 animate-pulse" title="Pendência urgente" />
                      )}
                    </div>

                    {/* Day Event Chips */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1 mt-1 flex-1 overflow-hidden">
                      {day.items.slice(0, 2).map((item) => {
                        const isDone = item.completed;
                        const badgeColor = isDone
                          ? 'bg-fundo-sutil text-texto-medio line-through border-borda'
                          : item.priority === 'urgente'
                          ? 'bg-perigo-suave text-perigo border-perigo'
                          : item.priority === 'alta'
                          ? 'bg-alerta-suave text-alerta border-alerta'
                          : item.category === 'financeiro'
                          ? 'bg-primaria-suave text-primaria border-primaria'
                          : 'bg-primaria-suave text-primaria border-primaria';

                        return (
                          <div
                            key={item.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate font-medium flex items-center gap-1 ${badgeColor}`}
                            title={`${item.title} - ${item.clientName || ''}`}
                          >
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark truncate">{item.title}</span>
                          </div>
                        );
                      })}

                      {day.items.length > 2 && (
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[9px] font-bold text-texto-medio text-right pr-1">
                          +{day.items.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-4 text-xs text-texto-medio pt-3 border-t border-borda flex-wrap">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-primaria-suave"></span>
                <span>Dia de Hoje</span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-perigo-suave0"></span>
                <span>Urgente / Vencida</span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-alerta-suave0"></span>
                <span>Alta Prioridade</span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-primaria-suave0"></span>
                <span>Cobrança Financeira</span>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-fundo-sutil"></span>
                <span>Concluída</span>
              </div>
            </div>
          </div>

          {/* Side Drawer: Selected Day Detailed Agenda (1 Col) */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda shadow-sutil p-5 space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark border-b border-borda pb-3 flex items-center justify-between">
              <div>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-bold text-primaria uppercase tracking-wider block">
                  Agenda do Dia Selecionado
                </span>
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio mt-0.5">
                  {selectedDateFormatted.weekday}, {selectedDateFormatted.day} de {selectedDateFormatted.monthName}
                </h3>
              </div>

              {selectedDateFormatted.isToday && (
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2 py-0.5 rounded-md text-[11px] font-bold bg-primaria-suave text-primaria border border-primaria">
                  Hoje
                </span>
              )}
            </div>

            {/* Action items on this selected date */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3">
              {selectedDayItems.map((item) => {
                const isDone = item.completed;
                const priorityBadge =
                  item.priority === 'urgente'
                    ? 'bg-perigo-suave text-perigo border-perigo'
                    : item.priority === 'alta'
                    ? 'bg-alerta-suave text-alerta border-alerta'
                    : 'bg-primaria-suave text-primaria border-primaria';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-[var(--radius-card)] border transition-all ${
                      isDone
                        ? 'bg-fundo-sutil border-borda opacity-60'
                        : 'bg-superficie border-borda hover:border-borda-forte shadow-sutil'
                    }`}
                  >
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start gap-2.5">
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isDone
                            ? 'bg-sucesso-suave border-sucesso text-white'
                            : 'border-borda-forte hover:border-primaria bg-superficie'
                        }`}
                        title={isDone ? 'Reabrir pendência' : 'Concluir pendência'}
                      >
                        {isDone && <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />}
                      </button>

                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex-1 min-w-0">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wide border ${priorityBadge}`}
                          >
                            {item.priority}
                          </span>

                          <span
                            className={`text-xs font-semibold truncate ${
                              isDone ? 'line-through text-texto-medio' : 'text-texto-medio'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        {item.clientName && (
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2 flex items-center gap-1.5 text-xs text-primaria font-medium">
                            <Building className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            <button
                              onClick={() => handleOpenClient(item.clientId)}
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:underline flex items-center gap-1"
                            >
                              <span>{item.clientName}</span>
                              <ExternalLink className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pt-2 mt-2 border-t border-borda text-[11px] text-texto-medio">
                          <span>Resp: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{item.responsible}</strong></span>
                          {item.value && (
                            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">
                              {formatCurrency(item.value, hideValues)}
                            </span>
                          )}
                        </div>

                        {/* Direct Action Button */}
                        {!isDone && (
                          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2.5 pt-2 border-t border-borda flex items-center justify-end gap-2">
                            <button
                              onClick={() => onTriggerAction(item)}
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1 rounded-[var(--radius-controle)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold shadow-sutil transition-colors flex items-center gap-1"
                            >
                              <Send className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                              <span>Agir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedDayItems.length === 0 && (
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-8 text-center bg-fundo-sutil/80 rounded-[var(--radius-card)] border border-dashed border-borda">
                  <CalendarDays className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 text-texto-medio mx-auto mb-2" />
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Nenhum compromisso marcado</div>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">
                    Este dia está livre de pendências operacionais.
                  </p>
                  <button
                    onClick={() => {
                      setNewEventDate(selectedDateStr);
                      setIsNewEventModalOpen(true);
                    }}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-controle)] border border-borda bg-superficie hover:bg-fundo-sutil text-xs font-medium text-texto-medio transition-colors"
                  >
                    <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                    <span>Adicionar Ação</span>
                  </button>
                </div>
              )}
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark pt-2">
              <button
                onClick={() => {
                  setNewEventDate(selectedDateStr);
                  setIsNewEventModalOpen(true);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full py-2 rounded-[var(--radius-card)] border border-dashed border-primaria text-primaria hover:bg-primaria-suave text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                <span>Agendar compromisso nesta data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: VISÃO SEMANAL (Grade de 7 Dias Detalhados com Horários e Prazos) */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda shadow-sutil p-5 space-y-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between border-b border-borda pb-3">
            <div>
              <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
                Semana de {currentWeekDays[0].dayNumber} a {currentWeekDays[6].dayNumber} de {monthNames[currentMonthIndex]} {currentYear}
              </h2>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">
                Visualização detalhada dos prazos e ações distribuídos dia a dia
              </p>
            </div>

            <button
              onClick={handleGoToToday}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 text-xs font-semibold text-primaria bg-primaria-suave hover:bg-primaria-suave rounded-[var(--radius-controle)] border border-primaria transition-colors"
            >
              Semana Atual (07/09)
            </button>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-7 gap-3">
            {currentWeekDays.map((d, i) => (
              <div
                key={i}
                className={`p-3 rounded-[var(--radius-card)] border min-h-[300px] flex flex-col ${
                  d.isToday
                    ? 'border-primaria bg-primaria-suave/20'
                    : d.isSelected
                    ? 'border-primaria bg-primaria-suave/10'
                    : 'border-borda bg-superficie'
                }`}
              >
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-2 border-b border-borda">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">{d.weekday}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      d.isToday ? 'bg-primaria-suave text-white' : 'text-texto-medio bg-fundo-sutil'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2 space-y-2 flex-1">
                  {d.items.map((item) => (
                    <div
                      key={item.id}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2 rounded-[var(--radius-controle)] bg-fundo-sutil border border-borda text-xs space-y-1 hover:border-borda-forte transition-colors"
                    >
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                            item.priority === 'urgente'
                              ? 'bg-perigo-suave text-perigo'
                              : 'bg-primaria-suave text-primaria'
                          }`}
                        >
                          {item.priority}
                        </span>
                        {item.completed && (
                          <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-sucesso" />
                        )}
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio text-[11px] leading-snug">
                        {item.title}
                      </div>
                      {item.clientName && (
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-texto-medio truncate">
                          {item.clientName}
                        </div>
                      )}
                      {!item.completed && (
                        <button
                          onClick={() => onTriggerAction(item)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full mt-1 py-1 rounded bg-primaria hover:bg-primaria-hover text-white text-[10px] font-medium transition-colors"
                        >
                          Agir
                        </button>
                      )}
                    </div>
                  ))}

                  {d.items.length === 0 && (
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-center py-8 text-[11px] text-texto-medio">
                      Livre
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedDateStr(d.dateStr);
                    setNewEventDate(d.dateStr);
                    setIsNewEventModalOpen(true);
                  }}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-2 text-center text-[10px] font-semibold text-primaria hover:underline"
                >
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: LISTA DE AÇÕES CLÁSSICA (Fila de Tarefas por Categoria) */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Left Category Menu */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda p-3 space-y-1 shadow-sutil">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-2 text-[11px] font-semibold text-texto-medio uppercase tracking-wider">
              Categorias de Ação
            </div>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-card)] text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primaria-suave text-primaria font-semibold'
                      : 'text-texto-medio hover:bg-fundo-sutil'
                  }`}
                >
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primaria' : 'text-texto-medio'}`} />
                    <span>{cat.label}</span>
                  </div>
                  {cat.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-primaria text-white' : 'bg-fundo-sutil text-texto-medio'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark pt-4 border-t border-borda px-3 pb-2 text-[11px] text-texto-medio leading-relaxed">
              💡 <strong>Dica prática:</strong> Ações resolvidas alimentam automaticamente o histórico de relacionamento na Linha do Tempo do cliente.
            </div>
          </div>

          {/* Right Action Queue */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark md:col-span-3 space-y-3">
            {filteredItems.map((item) => {
              const isDone = item.completed;
              const priorityBadge =
                item.priority === 'urgente'
                  ? 'bg-perigo-suave text-perigo border-perigo'
                  : item.priority === 'alta'
                  ? 'bg-alerta-suave text-alerta border-alerta'
                  : 'bg-primaria-suave text-primaria border-primaria';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-[var(--radius-card)] border transition-all duration-150 ${
                    isDone
                      ? 'bg-fundo-sutil border-borda opacity-60'
                      : 'bg-superficie border-borda shadow-sutil hover:border-borda-forte'
                  }`}
                >
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start justify-between gap-4">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-sucesso-suave border-sucesso text-white'
                            : 'border-borda-forte hover:border-primaria bg-superficie'
                        }`}
                        title={isDone ? 'Marcar como não resolvida' : 'Concluir ação'}
                      >
                        {isDone && <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${priorityBadge}`}
                          >
                            {item.priority}
                          </span>

                          <span
                            className={`text-xs font-semibold ${
                              isDone ? 'line-through text-texto-medio' : 'text-texto-medio'
                            }`}
                          >
                            {item.title}
                          </span>

                          {item.clientName && (
                            <button
                              onClick={() => handleOpenClient(item.clientId)}
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-primaria hover:underline flex items-center gap-1"
                            >
                              <span>{item.clientName}</span>
                              <ExternalLink className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-4 text-[11px] text-texto-medio mt-3 flex-wrap">
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1">
                            <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-texto-medio" />
                            Prazo: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{item.dueDate}</strong>
                          </span>
                          <span>
                            Responsável: <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{item.responsible}</strong>
                          </span>
                          {item.value && (
                            <span>
                              Valor envolvido:{' '}
                              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-semibold">
                                {formatCurrency(item.value, hideValues)}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isDone && (
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onTriggerAction(item)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold shadow-sutil transition-colors"
                        >
                          <Send className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                          <span>Agir</span>
                        </button>

                        <button
                          onClick={() => handleToggleComplete(item.id)}
                          className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1.5 rounded-[var(--radius-controle)] border border-borda hover:bg-fundo-sutil text-xs font-medium text-texto-medio"
                          title="Marcar como resolvida"
                        >
                          Concluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda p-12 text-center shadow-sutil">
                <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-10 h-10 text-sucesso mx-auto mb-2" />
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio">Tudo em dia nesta categoria!</h3>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
                  Nenhuma ação pendente no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO COMPROMISSO / AÇÃO NO CALENDÁRIO */}
      {/* ========================================================================= */}
      {isNewEventModalOpen && (
        <div
          className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsNewEventModalOpen(false)}
        >
          <div
            className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full max-w-lg bg-superficie rounded-2xl shadow-2xl border border-borda overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between px-6 py-4 border-b border-borda bg-fundo-sutil/50">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-controle)] bg-primaria-suave text-primaria flex items-center justify-center font-bold">
                  <CalendarIcon className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio">Novo Compromisso / Ação</h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">Agendar compromisso ou tarefa no calendário</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 rounded-[var(--radius-controle)] text-texto-medio hover:text-texto-medio hover:bg-fundo-sutil"
              >
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="dark:bg-fundo-dark dark:text-texto-forte-dark p-6 space-y-4">
              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                  Título da Ação ou Compromisso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião com cliente, Cobrança de boleto, Envio de aditivo..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Data no Calendário *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria"
                  />
                </div>

                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newEventPriority}
                    onChange={(e) => setNewEventPriority(e.target.value as any)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria bg-superficie"
                  >
                    <option value="urgente">Urgente (Crítica)</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Categoria
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria bg-superficie"
                  >
                    <option value="financeiro">Financeiro (Cobrança/NFS-e)</option>
                    <option value="contratos">Contratos (Assinatura/Renovação)</option>
                    <option value="comercial">Comercial (Proposta/Reunião)</option>
                    <option value="integracoes">Integrações (Asaas)</option>
                  </select>
                </div>

                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Cliente Vinculado (Opcional)
                  </label>
                  <select
                    value={newEventClientId}
                    onChange={(e) => setNewEventClientId(e.target.value)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria bg-superficie"
                  >
                    <option value="">Nenhum cliente (Geral)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Valor Envolvido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 4500"
                    value={newEventValue}
                    onChange={(e) => setNewEventValue(e.target.value)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria"
                  />
                </div>

                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={newEventResponsible}
                    onChange={(e) => setNewEventResponsible(e.target.value)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria"
                  />
                </div>
              </div>

              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-xs font-semibold text-texto-medio mb-1">
                  Detalhes / Instruções
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva o contexto ou os próximos passos desta ação..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3 py-2 text-xs border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-end gap-2 pt-2 border-t border-borda">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-card)] border border-borda text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-card)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold shadow-sutil"
                >
                  Agendar Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
