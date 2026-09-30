import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  ArrowUpRight,
  FileText,
  AlertCircle,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { RouteId } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';

interface FinanceiroVisaoGeralViewProps {
  onNavigate: (route: RouteId) => void;
  hideValues: boolean;
}

interface CashFlowItem {
  mes: string;
  entradas: number;
  saidas: number;
  resultadoMes: number;
  saldo: number;
  periodoAnterior?: number;
}

const cashFlowData: CashFlowItem[] = [
  { mes: 'Abr', entradas: 185000, saidas: 82000, resultadoMes: 103000, saldo: 103000, periodoAnterior: 92000 },
  { mes: 'Mai', entradas: 210000, saidas: 89000, resultadoMes: 121000, saldo: 224000, periodoAnterior: 105000 },
  { mes: 'Jun', entradas: 195000, saidas: 91000, resultadoMes: 104000, saldo: 328000, periodoAnterior: 98000 },
  { mes: 'Jul', entradas: 240000, saidas: 94000, resultadoMes: 146000, saldo: 474000, periodoAnterior: 112000 },
  { mes: 'Ago', entradas: 255000, saidas: 95000, resultadoMes: 160000, saldo: 634000, periodoAnterior: 128000 },
  { mes: 'Set', entradas: 268940, saidas: 96210, resultadoMes: 172730, saldo: 806730, periodoAnterior: 145000 },
];

const categoryExpensesData = [
  { name: 'Mídia e Tráfego', value: 42000, color: 'var(--color-primaria)' },
  { name: 'Equipe e Pró-labore', value: 34000, color: '#12A66A' },
  { name: 'Ferramentas & SaaS', value: 12500, color: 'var(--color-primaria)' },
  { name: 'Infra & Escritório', value: 7710, color: '#F59E0B' },
];

const revenueBySegmentData = [
  { segment: 'E-commerce & Varejo', valor: 98000 },
  { segment: 'SaaS & Tecnologia', valor: 85000 },
  { segment: 'Saúde & Estética', valor: 52000 },
  { segment: 'Serviços B2B', valor: 33940 },
];

export const FinanceiroVisaoGeralView: React.FC<FinanceiroVisaoGeralViewProps> = ({
  onNavigate,
  hideValues,
}) => {
  const [timeRange, setTimeRange] = useState<'dias' | 'semanas' | 'mes' | 'trimestre' | 'semestre' | 'ano'>('mes');
  const [comparePeriod, setComparePeriod] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'pizza'>('area');
  const [selectedBank, setSelectedBank] = useState<string>('asaas');
  const [forecastScenario, setForecastScenario] = useState<'realista' | 'conservador' | 'otimista'>('realista');

  // Base Multiplier helper
  const getMultiplier = (_bank: string) => 1.0;

  // Dynamic datasets based on timeRange & comparison
  const getDataForTimeRange = () => {
    let base = cashFlowData;
    if (timeRange === 'dias') {
      base = [
        { mes: 'Seg', entradas: 8500, saidas: 3200, resultadoMes: 5300, saldo: 172000, periodoAnterior: 4200 },
        { mes: 'Ter', entradas: 12400, saidas: 4100, resultadoMes: 8300, saldo: 180300, periodoAnterior: 7100 },
        { mes: 'Qua', entradas: 9800, saidas: 3900, resultadoMes: 5900, saldo: 186200, periodoAnterior: 6500 },
        { mes: 'Qui', entradas: 15200, saidas: 5000, resultadoMes: 10200, saldo: 196400, periodoAnterior: 9400 },
        { mes: 'Sex', entradas: 22100, saidas: 6800, resultadoMes: 15300, saldo: 211700, periodoAnterior: 13200 },
      ];
    } else if (timeRange === 'semanas') {
      base = [
        { mes: 'Sem 1', entradas: 52000, saidas: 21000, resultadoMes: 31000, saldo: 145000, periodoAnterior: 26000 },
        { mes: 'Sem 2', entradas: 61000, saidas: 24000, resultadoMes: 37000, saldo: 182000, periodoAnterior: 31000 },
        { mes: 'Sem 3', entradas: 58000, saidas: 23000, resultadoMes: 35000, saldo: 217000, periodoAnterior: 29000 },
        { mes: 'Sem 4', entradas: 67940, saidas: 28210, resultadoMes: 39730, saldo: 256730, periodoAnterior: 34000 },
      ];
    } else if (timeRange === 'trimestre') {
      base = [
        { mes: 'Q4 2025', entradas: 540000, saidas: 230000, resultadoMes: 310000, saldo: 310000, periodoAnterior: 270000 },
        { mes: 'Q1 2026', entradas: 590000, saidas: 245000, resultadoMes: 345000, saldo: 655000, periodoAnterior: 290000 },
        { mes: 'Q2 2026', entradas: 640000, saidas: 265000, resultadoMes: 375000, saldo: 1030000, periodoAnterior: 320000 },
      ];
    } else if (timeRange === 'semestre') {
      base = [
        { mes: 'S2 2025', entradas: 1050000, saidas: 460000, resultadoMes: 590000, saldo: 590000, periodoAnterior: 510000 },
        { mes: 'S1 2026', entradas: 1280000, saidas: 520000, resultadoMes: 760000, saldo: 1350000, periodoAnterior: 640000 },
      ];
    } else if (timeRange === 'ano') {
      base = [
        { mes: '2024', entradas: 2100000, saidas: 920000, resultadoMes: 1180000, saldo: 1180000, periodoAnterior: 980000 },
        { mes: '2025', entradas: 2650000, saidas: 1100000, resultadoMes: 1550000, saldo: 2730000, periodoAnterior: 1320000 },
        { mes: '2026 (YTD)', entradas: 2330000, saidas: 980000, resultadoMes: 1350000, saldo: 4080000, periodoAnterior: 1150000 },
      ];
    }

    const mult = getMultiplier(selectedBank);
    return base.map(item => ({
      ...item,
      entradas: Math.round(item.entradas * mult),
      saidas: Math.round(item.saidas * mult),
      resultadoMes: Math.round(item.resultadoMes * mult),
      saldo: Math.round(item.saldo * mult),
      periodoAnterior: Math.round((item.periodoAnterior || 0) * mult),
    }));
  };

  const activeData = getDataForTimeRange();

  // 3-Month Forecast Data based on 28 active recurring contracts & receivables history
  const getForecastMonths = () => {
    const scenarioMult = forecastScenario === 'conservador' ? 0.90 : forecastScenario === 'otimista' ? 1.12 : 1.0;
    const costMult = forecastScenario === 'conservador' ? 1.05 : forecastScenario === 'otimista' ? 0.98 : 1.0;

    return [
      {
        mes: 'Outubro / 2026',
        mesCurto: 'Out/26',
        recorrenciaContratos: Math.round(242500 * scenarioMult),
        faturasEmitidasAsaas: Math.round(31400 * scenarioMult),
        variavelSucesso: Math.round(14500 * scenarioMult),
        entradasTotal: Math.round((242500 + 31400 + 14500) * scenarioMult),
        custosFixos: Math.round(48500 * costMult),
        custosVariaveisMidia: Math.round(42000 * costMult),
        ferramentasSaaS: Math.round(8200 * costMult),
        saidasTotal: Math.round((48500 + 42000 + 8200) * costMult),
        lucroProjetado: Math.round(((242500 + 31400 + 14500) * scenarioMult) - ((48500 + 42000 + 8200) * costMult)),
        saldoAcumulado: Math.round(184320 + (((242500 + 31400 + 14500) * scenarioMult) - ((48500 + 42000 + 8200) * costMult))),
        certeza: '96%',
        contratosAtivos: 28,
        inadimplenciaBuffer: '1.8%',
      },
      {
        mes: 'Novembro / 2026',
        mesCurto: 'Nov/26',
        recorrenciaContratos: Math.round(258000 * scenarioMult),
        faturasEmitidasAsaas: Math.round(28000 * scenarioMult),
        variavelSucesso: Math.round(19800 * scenarioMult),
        entradasTotal: Math.round((258000 + 28000 + 19800) * scenarioMult),
        custosFixos: Math.round(49000 * costMult),
        custosVariaveisMidia: Math.round(45500 * costMult),
        ferramentasSaaS: Math.round(8500 * costMult),
        saidasTotal: Math.round((49000 + 45500 + 8500) * costMult),
        lucroProjetado: Math.round(((258000 + 28000 + 19800) * scenarioMult) - ((49000 + 45500 + 8500) * costMult)),
        saldoAcumulado: Math.round(184320 + 189700 + (((258000 + 28000 + 19800) * scenarioMult) - ((49000 + 45500 + 8500) * costMult))),
        certeza: '91%',
        contratosAtivos: 30,
        inadimplenciaBuffer: '2.2%',
      },
      {
        mes: 'Dezembro / 2026',
        mesCurto: 'Dez/26',
        recorrenciaContratos: Math.round(274000 * scenarioMult),
        faturasEmitidasAsaas: Math.round(35000 * scenarioMult),
        variavelSucesso: Math.round(26500 * scenarioMult),
        entradasTotal: Math.round((274000 + 35000 + 26500) * scenarioMult),
        custosFixos: Math.round(52000 * costMult),
        custosVariaveisMidia: Math.round(51000 * costMult),
        ferramentasSaaS: Math.round(8800 * costMult),
        saidasTotal: Math.round((52000 + 51000 + 8800) * costMult),
        lucroProjetado: Math.round(((274000 + 35000 + 26500) * scenarioMult) - ((52000 + 51000 + 8800) * costMult)),
        saldoAcumulado: Math.round(184320 + 189700 + 202800 + (((274000 + 35000 + 26500) * scenarioMult) - ((52000 + 51000 + 8800) * costMult))),
        certeza: '85%',
        contratosAtivos: 32,
        inadimplenciaBuffer: '2.5%',
      },
    ];
  };

  const forecastMonths = getForecastMonths();
  const totalForecastEntradas = forecastMonths.reduce((acc, m) => acc + m.entradasTotal, 0);
  const totalForecastSaidas = forecastMonths.reduce((acc, m) => acc + m.saidasTotal, 0);
  const totalForecastLucro = totalForecastEntradas - totalForecastSaidas;

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      {/* Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight">Financeiro — Visão Geral & Inteligência</h1>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            Fluxo de caixa realizado x projetado, DRE gerencial completo, conciliação bancária IA e análise de margem por segmento.
          </p>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 flex-wrap">
          <button
            id="btn-nav-conciliacao-ia"
            onClick={() => onNavigate('conciliacao')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-sucesso-suave hover:bg-sucesso-suave text-white text-xs font-semibold shadow-sutil transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Conciliação Bancária IA</span>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] px-1.5 py-0.5 bg-superficie/20 rounded font-bold">5 pendentes</span>
          </button>
          <button
            id="btn-nav-notas-cobrancas"
            onClick={() => onNavigate('notas-cobrancas')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold shadow-sutil transition-colors flex items-center gap-1.5"
          >
            <span>Notas & Cobranças</span>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] px-1.5 py-0.5 bg-superficie/25 rounded">Asaas</span>
          </button>
          <button
            onClick={() => onNavigate('financeiro-receber')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-sucesso-suave hover:bg-sucesso-suave text-white text-xs font-medium shadow-card transition-colors"
          >
            Contas a Receber
          </button>
          <button
            onClick={() => onNavigate('financeiro-pagar')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 rounded-[var(--radius-controle)] bg-primaria hover:bg-primaria-hover text-white text-xs font-medium shadow-card transition-colors"
          >
            Contas a Pagar
          </button>
        </div>
      </div>

      {/* Main Consolidated KPIs */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Saldo em Conta Asaas</span>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio mt-2">
            {formatCurrency(184320, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>↗ Saldo disponível Asaas</span>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Resultado do Mês</span>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-sucesso mt-2">
            {formatCurrency(172730, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Entradas - Saídas (Set)</span>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">A Receber no Mês</span>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-sucesso mt-2">
            {formatCurrency(268940, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            {formatCurrency(197450, hideValues)} já recebidos (73.4% liquidez)
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">A Pagar no Mês</span>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-perigo mt-2">
            {formatCurrency(96210, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">Mídia, infraestrutura e ferramentas</div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-borda shadow-card">
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio uppercase tracking-wider">Previsão Próx. 3 Meses</span>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-[var(--color-primaria)] mt-2">
            {formatCurrency(totalForecastLucro, hideValues)}
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-primaria mt-1 font-medium flex items-center gap-1">
            <ShieldCheck className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            <span>Projeção líquida trimestral</span>
          </div>
        </div>
      </div>

      {/* COMPONENTE: PREVISÃO DE CAIXA (PRÓXIMOS 3 MESES) */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-primaria shadow-card overflow-hidden">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-gradient-to-r from-primaria via-primaria to-borda p-6 text-white">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-primaria)] text-white flex items-center gap-1">
                  <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                  Previsão Inteligente de Caixa
                </span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-primaria">
                  Baseado em 28 contratos recorrentes ativos & histórico Asaas
                </span>
              </div>
              <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xl font-bold tracking-tight text-white">
                Projeção de Fluxo de Caixa — Próximos 3 Meses (Q4/2026)
              </h2>
              <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-primaria/80 max-w-2xl">
                Algoritmo preditivo considerando renovações de contratos, faturas emitidas e agendadas no Asaas, orçamento de mídia e taxa histórica de inadimplência (2.1%).
              </p>
            </div>

            {/* Scenario Selector */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie/10 backdrop-blur-md p-1.5 rounded-[var(--radius-card)] border border-white/15 flex items-center gap-1 shrink-0">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-primaria px-2 font-medium flex items-center gap-1">
                <Sliders className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" /> Cenário:
              </span>
              {[
                { id: 'conservador', label: 'Conservador (-10%)' },
                { id: 'realista', label: 'Realista (Padrão)' },
                { id: 'otimista', label: 'Otimista (+12%)' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setForecastScenario(s.id as any)}
                  className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold transition-all ${
                    forecastScenario === s.id
                      ? 'bg-superficie text-primaria shadow-card'
                      : 'text-primaria hover:text-white hover:bg-superficie/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie/5 backdrop-blur-sm rounded-[var(--radius-card)] p-3.5 border border-white/10">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-medium text-primaria uppercase tracking-wider block">
                Total Entradas Previstas (3 Meses)
              </span>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-black text-sucesso mt-1">
                {formatCurrency(totalForecastEntradas, hideValues)}
              </div>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-primaria mt-0.5 block">
                MRR Contratado + Faturas Asaas + Sucesso
              </span>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie/5 backdrop-blur-sm rounded-[var(--radius-card)] p-3.5 border border-white/10">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-medium text-primaria uppercase tracking-wider block">
                Total Saídas Previstas (3 Meses)
              </span>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-black text-perigo mt-1">
                {formatCurrency(totalForecastSaidas, hideValues)}
              </div>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-primaria mt-0.5 block">
                Custos Fixos + Orçamento Mídia + SaaS
              </span>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie/5 backdrop-blur-sm rounded-[var(--radius-card)] p-3.5 border border-white/10">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-medium text-primaria uppercase tracking-wider block">
                Lucro Líquido Acumulado Projetado
              </span>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-black text-white mt-1">
                {formatCurrency(totalForecastLucro, hideValues)}
              </div>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-sucesso font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" /> Margem líquida média estimada em ~62.3%
              </span>
            </div>
          </div>
        </div>

        {/* 3 Monthly Projection Cards */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-6 bg-fundo-sutil/50">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-3 gap-6">
            {forecastMonths.map((m, idx) => (
              <div
                key={m.mes}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-[var(--radius-card)] border border-borda/80 p-5 shadow-sutil hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-primaria)] to-primaria" />
                
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between mb-3 pt-1">
                    <div>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio uppercase tracking-wider">Mês {idx + 1} de 3</span>
                      <h4 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">{m.mes}</h4>
                    </div>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-full text-[11px] font-bold bg-sucesso-suave text-sucesso border border-sucesso flex items-center gap-1">
                      <ShieldCheck className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" /> {m.certeza} certeza
                    </span>
                  </div>

                  {/* Entradas detail */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 mb-4">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs pb-1 border-b border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium flex items-center gap-1.5">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-sucesso-suave0"></span>
                        Contratos Ativos ({m.contratosAtivos} clientes)
                      </span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{formatCurrency(m.recorrenciaContratos, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs pb-1 border-b border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium flex items-center gap-1.5">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave0"></span>
                        Faturas Agendadas Asaas
                      </span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{formatCurrency(m.faturasEmitidasAsaas, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs pb-1 border-b border-borda">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium flex items-center gap-1.5">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave0"></span>
                        Bônus de Sucesso Estimado
                      </span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{formatCurrency(m.variavelSucesso, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs font-semibold text-sucesso bg-sucesso-suave/60 p-2 rounded-[var(--radius-controle)]">
                      <span>Total Entradas Projetadas</span>
                      <span>{formatCurrency(m.entradasTotal, hideValues)}</span>
                    </div>
                  </div>

                  {/* Saidas detail */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1.5 mb-4 text-xs">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between text-texto-medio">
                      <span>Custos Fixos & Equipe</span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-medium text-texto-medio">{formatCurrency(m.custosFixos, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between text-texto-medio">
                      <span>Mídia Paga & Campanhas</span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-medium text-texto-medio">{formatCurrency(m.custosVariaveisMidia, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between text-texto-medio">
                      <span>Ferramentas & Infra SaaS</span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-medium text-texto-medio">{formatCurrency(m.ferramentasSaaS, hideValues)}</span>
                    </div>
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs font-semibold text-perigo bg-perigo-suave/60 p-2 rounded-[var(--radius-controle)]">
                      <span>Total Saídas Previstas</span>
                      <span>- {formatCurrency(m.saidasTotal, hideValues)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Summary */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark pt-3 border-t border-borda mt-2 space-y-1">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center text-xs">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">Resultado Líquido</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-black text-sucesso">
                      + {formatCurrency(m.lucroProjetado, hideValues)}
                    </span>
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center text-[11px] text-texto-medio">
                    <span>Saldo Acumulado Asaas</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-primaria">
                      {formatCurrency(m.saldoAcumulado, hideValues)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contextual Intelligence Bar */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-5 p-4 rounded-[var(--radius-card)] bg-primaria-suave border border-primaria flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5 text-primaria">
              <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[var(--color-primaria)] shrink-0" />
              <span>
                <strong>Destaque IA:</strong> 4 contratos de alta relevância com ciclo de renovação previsto para Novembro (+R$ 38.000/mês). Faturas recorrentes com 98.2% de taxa de conversão via Asaas Pix/Cartão.
              </span>
            </div>
            <button
              onClick={() => onNavigate('contratos')}
              className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white font-semibold transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Ver 28 Contratos Ativos</span>
              <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa (Chart with multiple views) */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio">Evolução do Fluxo de Caixa & Saldo Acumulado</h3>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">Histórico de resultados por período com comparativo.</p>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 flex-wrap">
                {/* Period Selector */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1 bg-fundo-sutil p-1 rounded-[var(--radius-controle)] text-xs">
                  {[
                    { id: 'dias', label: 'Dias' },
                    { id: 'semanas', label: 'Semanas' },
                    { id: 'mes', label: 'Mês' },
                    { id: 'trimestre', label: 'Trimestre' },
                    { id: 'semestre', label: 'Semestre' },
                    { id: 'ano', label: 'Anual' },
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setTimeRange(period.id as any)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${timeRange === period.id ? 'bg-primaria text-white shadow-sutil' : 'text-texto-medio hover:bg-fundo-sutil'}`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Compare toggle */}
                <button
                  onClick={() => setComparePeriod(!comparePeriod)}
                  className={`px-2.5 py-1 rounded-[var(--radius-controle)] text-xs font-medium transition-colors border ${comparePeriod ? 'bg-primaria-suave border-primaria text-primaria' : 'bg-superficie border-borda text-texto-medio'}`}
                  title="Comparar com período anterior"
                >
                  {comparePeriod ? '✓ Comparando Período' : '+ Comparar'}
                </button>

                {/* View type selector */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1 bg-fundo-sutil p-1 rounded-[var(--radius-controle)] text-xs">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${chartType === 'area' ? 'bg-superficie shadow-sutil text-primaria font-semibold' : 'text-texto-medio'}`}
                  >
                    Área
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${chartType === 'bar' ? 'bg-superficie shadow-sutil text-primaria font-semibold' : 'text-texto-medio'}`}
                  >
                    Colunas
                  </button>
                  <button
                    onClick={() => setChartType('pizza')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${chartType === 'pizza' ? 'bg-superficie shadow-sutil text-primaria font-semibold' : 'text-texto-medio'}`}
                  >
                    Pizza
                  </button>
                </div>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primaria)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primaria)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorResultadoMes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#12A66A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#12A66A" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D92D4E" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D92D4E" stopOpacity={0.0}/>
                      </linearGradient>
                      {comparePeriod && (
                        <linearGradient id="colorComparativo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                        </linearGradient>
                      )}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        formatCurrency(Number(val), hideValues),
                        name === 'saldo' ? 'Resultado Acumulado' : name === 'resultadoMes' ? 'Resultado do Período' : name === 'periodoAnterior' ? 'Período Anterior (Comparativo)' : 'Saídas (Despesas)'
                      ]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="saldo" stroke="var(--color-primaria)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAcumulado)" name="saldo" />
                    <Area type="monotone" dataKey="resultadoMes" stroke="#12A66A" strokeWidth={2} fillOpacity={1} fill="url(#colorResultadoMes)" name="resultadoMes" />
                    <Area type="monotone" dataKey="saidas" stroke="#D92D4E" strokeWidth={2} fillOpacity={1} fill="url(#colorSaidas)" name="saidas" />
                    {comparePeriod && (
                      <Area type="monotone" dataKey="periodoAnterior" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorComparativo)" name="periodoAnterior" />
                    )}
                  </AreaChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        formatCurrency(Number(val), hideValues),
                        name === 'saldo' ? 'Resultado Acumulado' : name === 'resultadoMes' ? 'Resultado do Período' : name === 'periodoAnterior' ? 'Período Anterior' : 'Saídas (Despesas)'
                      ]}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="saldo" fill="var(--color-primaria)" radius={[4, 4, 0, 0]} name="saldo" />
                    <Bar dataKey="resultadoMes" fill="#12A66A" radius={[4, 4, 0, 0]} name="resultadoMes" />
                    <Bar dataKey="saidas" fill="#D92D4E" radius={[4, 4, 0, 0]} name="saidas" />
                    {comparePeriod && (
                      <Bar dataKey="periodoAnterior" fill="#94A3B8" radius={[4, 4, 0, 0]} name="periodoAnterior" />
                    )}
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Resultado do Período', value: activeData.reduce((acc, i) => acc + i.resultadoMes, 0), color: '#12A66A' },
                        { name: 'Saídas Operacionais', value: activeData.reduce((acc, i) => acc + i.saidas, 0), color: '#D92D4E' },
                        { name: 'Reserva Acumulada', value: activeData[activeData.length - 1]?.saldo || 500000, color: 'var(--color-primaria)' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {[
                        { color: '#12A66A' },
                        { color: '#D92D4E' },
                        { color: 'var(--color-primaria)' },
                      ].map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), hideValues), 'Valor']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.75rem', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between text-xs text-texto-medio pt-4 border-t border-borda mt-2">
            <span>Visualização interativa selecionada ({chartType.toUpperCase()})</span>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-primaria">Atualizado via Open Finance</span>
          </div>
        </div>

        {/* Despesas por Categoria (Pie Chart) */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card flex flex-col justify-between">
          <div>
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio mb-1">Despesas por Categoria</h3>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mb-4">Distribuição dos custos operacionais do mês.</p>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpensesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryExpensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1.5 pt-3 border-t border-borda text-xs">
            {categoryExpensesData.map((item) => (
              <div key={item.name} className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">{item.name}</span>
                </div>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{formatCurrency(item.value, hideValues)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contas Bancárias (Open Finance) & DRE Resumido */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas Bancárias */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card space-y-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio">
              Contas Bancárias (Open Finance Pluggy)
            </h3>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-sucesso font-medium">Sincronizado hoje 06:00</span>
          </div>

          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda flex items-center justify-between">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-10 h-10 rounded-[var(--radius-controle)] bg-[#FF6A00]/10 text-[#FF6A00] font-bold flex items-center justify-center text-sm">
                  IT
                </div>
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">Itaú Unibanco PJ (Itaú - CC)</div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Ag 0451 / CC 19.824-3 • Open Finance</div>
                </div>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right flex items-center gap-3">
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio">
                    {formatCurrency(142320, hideValues)}
                  </div>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-alerta font-bold bg-alerta-suave px-1.5 py-0.5 rounded">
                    5 a conciliar
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('conciliacao')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-1.5 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-bold shadow-sutil transition-colors flex items-center gap-1"
                >
                  <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                  <span>Conciliar</span>
                </button>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda flex items-center justify-between">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-10 h-10 rounded-[var(--radius-controle)] bg-[#820AD1]/10 text-[#820AD1] font-bold flex items-center justify-center text-sm">
                  NU
                </div>
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">Nubank PJ</div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Conta Operacional e Cartão</div>
                </div>
              </div>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-right">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio">
                  {formatCurrency(42000, hideValues)}
                </div>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[10px] text-sucesso font-medium">Conciliado</span>
              </div>
            </div>
          </div>
        </div>

        {/* DRE Gerencial Resumido */}
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-6 rounded-[var(--radius-card)] border border-borda shadow-card space-y-3 text-xs">
          <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-texto-medio mb-2">DRE Gerencial — Setembro/2026</h3>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-texto-medio">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-borda">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">(+) Receita Bruta de Serviços</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-sucesso">
                {formatCurrencyDetailed(268940, hideValues)}
              </span>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-borda">
              <span>(-) Impostos sobre Serviços (Simples Nacional)</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-perigo">
                {hideValues ? '••••' : '- R$ 16.136,40 (6.0%)'}
              </span>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-borda">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">(=) Receita Líquida</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">
                {hideValues ? '••••' : 'R$ 252.803,60'}
              </span>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-borda">
              <span>(-) Custos Operacionais e Mídia</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-perigo">
                {hideValues ? '••••' : '- R$ 96.210,00'}
              </span>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-2 pt-3 border-t-2 border-borda text-sm">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">(=) Lucro Operacional Líquido</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-primaria">
                {formatCurrencyDetailed(88730, hideValues)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
