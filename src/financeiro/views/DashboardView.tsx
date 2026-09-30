import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  CalendarClock,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Building2,
  CheckCircle2,
  Users,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import { formatarMoeda, formatarPorcentagem, formatarDataBR, getDataHojeISO, getMesAtualISO } from '../utils/formatters';
import { calcularSaldoConta, obterValorEfetivoLancamento } from '../utils/calculations';

type CardDetalhe = 'saldo' | 'receitas' | 'despesas' | 'resultado';

export const DashboardView: React.FC = () => {
  const [detalheCard, setDetalheCard] = useState<CardDetalhe | null>(null);
  const {
    lancamentos,
    contas,
    clientes,
    extratoTransacoes,
    abrirModalNovoLancamento,
    marcarComoRealizadoRapido,
    setActiveTab,
    configuracoes,
    mesSelecionado,
    isLancamentoNoPeriodo,
    mesesDoPeriodoAtual,
  } = useApp();

  const hoje = getDataHojeISO();
  const mesAtual = getMesAtualISO();
  const mesReferencia = mesSelecionado;

  // Se não houver nenhum lançamento nem contas, renderiza empty state amigável
  const temDados = lancamentos.length > 0 || contas.length > 0;

  // 1. Saldo Atual Consolidado
  const saldoConsolidado = useMemo(() => {
    return contas
      .filter((c) => c.ativa)
      .reduce((acc, c) => acc + calcularSaldoConta(c, lancamentos).saldoAtual, 0);
  }, [contas, lancamentos]);

  const debitosAsaasDoMes = useMemo(
    () => extratoTransacoes.filter(
      (transacao) =>
        transacao.id.startsWith('asaas-extrato-') &&
        !transacao.ignorado &&
        transacao.valorCents < 0 &&
        transacao.data.slice(0, 7) === mesReferencia
    ),
    [extratoTransacoes, mesReferencia]
  );

  const movimentacoesAsaasDoMes = useMemo(
    () => extratoTransacoes
      .filter((transacao) =>
        transacao.id.startsWith('asaas-extrato-') &&
        !transacao.ignorado &&
        transacao.data.slice(0, 7) === mesReferencia
      )
      .sort((a, b) => b.data.localeCompare(a.data)),
    [extratoTransacoes, mesReferencia]
  );

  const creditosAsaasDoMes = useMemo(
    () => movimentacoesAsaasDoMes.filter((transacao) => transacao.valorCents > 0),
    [movimentacoesAsaasDoMes]
  );

  const resumoExtratoAsaas = useMemo(() => ({
    entradas: creditosAsaasDoMes.reduce((total, transacao) => total + transacao.valorCents, 0),
    saidas: debitosAsaasDoMes.reduce((total, transacao) => total + Math.abs(transacao.valorCents), 0),
  }), [creditosAsaasDoMes, debitosAsaasDoMes]);

  const saldoAsaas = useMemo(() => {
    const conta = contas.find((item) => item.id === 'asaas-saldo-producao');
    return conta ? calcularSaldoConta(conta, lancamentos).saldoAtual : null;
  }, [contas, lancamentos]);

  // 2. Receita e Despesa do Mês Corrente (Orçado x Realizado)
  const metricasMesAtual = useMemo(() => {
    let recOrcada = 0;
    let recRealizada = 0;
    let despOrcada = 0;
    let despRealizada = 0;

    const debitosExtratoMes = debitosAsaasDoMes;
    const normalizarDescricao = (descricao: string) => descricao.toLocaleLowerCase().replace(/\s+/g, ' ').trim();

    lancamentos.forEach((l) => {
      if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
      if (l.mesCompetencia === mesReferencia) {
        if (l.tipo === 'receita') {
          recOrcada += l.valorOrcado;
          if (l.valorRealizado !== undefined) recRealizada += l.valorRealizado;
          else if (l.status === 'realizado') recRealizada += l.valorOrcado;
        } else if (l.tipo === 'despesa') {
          despOrcada += l.valorOrcado;
          const valorRealizado = l.valorRealizado !== undefined
            ? l.valorRealizado
            : l.status === 'realizado'
              ? l.valorOrcado
              : 0;
          const jaRepresentadoNoExtrato = debitosExtratoMes.some((transacao) =>
            transacao.lancamentoIdVinculado === l.id || (
              transacao.contaBancariaId === l.contaBancariaId &&
              transacao.data === (l.dataPagamento || l.dataVencimento) &&
              Math.abs(transacao.valorCents) === valorRealizado &&
              normalizarDescricao(transacao.descricao) === normalizarDescricao(l.descricao)
            )
          );
          if (!jaRepresentadoNoExtrato) despRealizada += valorRealizado;
        }
      }
    });

    // Todo débito importado no extrato é uma saída já realizada, inclusive antes da conciliação.
    despRealizada += debitosExtratoMes.reduce((total, transacao) => total + Math.abs(transacao.valorCents), 0);

    const resultadoRealizado = recRealizada - despRealizada;
    const resultadoOrcado = recOrcada - despOrcada;
    const margemRealizada = recRealizada > 0 ? (resultadoRealizado / recRealizada) * 100 : 0;

    return {
      recOrcada,
      recRealizada,
      despOrcada,
      despRealizada,
      resultadoRealizado,
      resultadoOrcado,
      margemRealizada,
    };
  }, [debitosAsaasDoMes, lancamentos, mesReferencia]);

  // 3. Receita Recorrente Mensal (MRR) de clientes ativos
  const mrrTotal = useMemo(() => {
    return clientes
      .filter((c) => c.status === 'ativo')
      .reduce((acc, c) => acc + (c.valorMensal || 0), 0);
  }, [clientes]);

  // 4. Projeções de Saldo (Fim do Mês, 3, 6 e 12 meses)
  const projecoesSaldo = useMemo(() => {
    // Calculamos o saldo projetado no horizonte futuro
    const mesesHorizontes = [1, 3, 6, 12];
    const agora = new Date();

    const calcularSaldoAteMes = (mesesAdicionais: number) => {
      const dataAlvo = new Date(agora.getFullYear(), agora.getMonth() + mesesAdicionais + 1, 0);
      const dataAlvoStr = `${dataAlvo.getFullYear()}-${String(dataAlvo.getMonth() + 1).padStart(2, '0')}-${String(dataAlvo.getDate()).padStart(2, '0')}`;

      let saldo = saldoConsolidado;
      lancamentos.forEach((l) => {
        if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
        // Considera lançamentos que vencem entre hoje e dataAlvo que ainda não foram realizados
        const data = l.dataVencimento;
        if (data > hoje && data <= dataAlvoStr && l.valorRealizado === undefined && l.status !== 'realizado') {
          if (l.tipo === 'receita') {
            saldo += l.valorOrcado;
          } else if (l.tipo === 'despesa') {
            saldo -= l.valorOrcado;
          }
        }
      });
      return saldo;
    };

    return {
      fimMes: calcularSaldoAteMes(0),
      tresMeses: calcularSaldoAteMes(3),
      seisMeses: calcularSaldoAteMes(6),
      dozeMeses: calcularSaldoAteMes(12),
    };
  }, [saldoConsolidado, lancamentos, hoje]);

  // 5. Gráfico de Barras: Orçado x Realizado mensal
  const dadosGraficoMensal = useMemo(() => {
    const map = new Map<
      string,
      { mes: string; recOrcada: number; recRealizada: number; despOrcada: number; despRealizada: number }
    >();

    mesesDoPeriodoAtual.forEach((m) => {
      map.set(m, {
        mes: m.split('-')[1] + '/' + m.split('-')[0].slice(2),
        recOrcada: 0,
        recRealizada: 0,
        despOrcada: 0,
        despRealizada: 0,
      });
    });

    lancamentos.forEach((l) => {
      if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
      if (map.has(l.mesCompetencia)) {
        const item = map.get(l.mesCompetencia)!;
        const valRealizado = l.valorRealizado !== undefined ? l.valorRealizado : (l.status === 'realizado' ? l.valorOrcado : 0);
        if (l.tipo === 'receita') {
          item.recOrcada += l.valorOrcado / 100;
          item.recRealizada += valRealizado / 100;
        } else if (l.tipo === 'despesa') {
          item.despOrcada += l.valorOrcado / 100;
          item.despRealizada += valRealizado / 100;
        }
      }
    });

    return Array.from(map.values());
  }, [lancamentos, mesesDoPeriodoAtual]);

  // 6. Gráfico de Linha: Saldo Acumulado Realizado x Projetado
  const dadosSaldoAcumulado = useMemo(() => {
    let acumulado = saldoConsolidado / 100;
    const resultado: { mes: string; saldo: number; isNegativo: boolean }[] = [];

    mesesDoPeriodoAtual.forEach((m) => {
      let fluxoMes = 0;
      lancamentos.forEach((l) => {
        if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
        if (l.mesCompetencia === m) {
          const valor = obterValorEfetivoLancamento(l) / 100;
          if (l.tipo === 'receita') fluxoMes += valor;
          else if (l.tipo === 'despesa') fluxoMes -= valor;
        }
      });
      acumulado += fluxoMes;
      resultado.push({
        mes: m.split('-')[1] + '/' + m.split('-')[0].slice(2),
        saldo: Math.round(acumulado),
        isNegativo: acumulado < 0,
      });
    });

    return resultado;
  }, [lancamentos, mesesDoPeriodoAtual, saldoConsolidado]);

  // 7. Gráfico Rosca: Despesas por Grupo
  const dadosDespesasPorGrupo = useMemo(() => {
    const gruposMap = new Map<string, number>();
    lancamentos.forEach((l) => {
      if (l.tipo !== 'despesa' || l.status === 'cancelado') return;
      if (isLancamentoNoPeriodo(l)) {
        const val = obterValorEfetivoLancamento(l);
        const grupo = l.grupo || 'Outras Despesas';
        gruposMap.set(grupo, (gruposMap.get(grupo) || 0) + val);
      }
    });

    const cores = ['#6366f1', '#ec4899', '#f97316', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444'];
    return Array.from(gruposMap.entries()).map(([name, value], i) => ({
      name,
      value: value / 100,
      cor: cores[i % cores.length],
    }));
  }, [lancamentos, isLancamentoNoPeriodo]);

  // 8. Ranking de Receita por Cliente com % de Concentração
  const rankingClientes = useMemo(() => {
    const clientesMap = new Map<string, number>();
    let totalReceitasClientes = 0;

    lancamentos.forEach((l) => {
      if (l.tipo !== 'receita' || l.status === 'cancelado') return;
      if (isLancamentoNoPeriodo(l)) {
        const val = obterValorEfetivoLancamento(l);
        totalReceitasClientes += val;
        const nomeCli = l.clienteId
          ? clientes.find((c) => c.id === l.clienteId)?.nomeRazaoSocial || 'Cliente não identificado'
          : 'Avulso / Sem cliente';
        clientesMap.set(nomeCli, (clientesMap.get(nomeCli) || 0) + val);
      }
    });

    return Array.from(clientesMap.entries())
      .map(([nome, valor]) => ({
        nome,
        valor,
        concentracaoPct: totalReceitasClientes > 0 ? (valor / totalReceitasClientes) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [lancamentos, clientes, isLancamentoNoPeriodo]);

  // 9. Próximos 7 dias (contas a pagar e receber)
  const proximos7Dias = useMemo(() => {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    const limiteStr = dataLimite.toISOString().split('T')[0];

    return lancamentos
      .filter((l) => {
        if (l.status === 'cancelado' || l.status === 'realizado' || l.valorRealizado !== undefined) return false;
        return l.dataVencimento >= hoje && l.dataVencimento <= limiteStr;
      })
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [lancamentos, hoje]);

  // 10. Lançamentos Vencidos
  const lancamentosVencidos = useMemo(() => {
    return lancamentos
      .filter((l) => l.status === 'vencido')
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [lancamentos]);

  // 11. Contratos de Clientes terminando nos próximos 60 dias
  const contratosTerminando = useMemo(() => {
    const data60 = new Date();
    data60.setDate(data60.getDate() + 60);
    const data60Str = data60.toISOString().split('T')[0];

    return clientes.filter((c) => {
      if (c.status !== 'ativo' || !c.dataFim) return false;
      return c.dataFim >= hoje && c.dataFim <= data60Str;
    });
  }, [clientes, hoje]);

  // 12. Alertas Automáticos do Sistema
  const alertas = useMemo(() => {
    const lista: { tipo: 'perigo' | 'aviso'; texto: string }[] = [];

    // Alerta de saldo projetado negativo
    if (projecoesSaldo.fimMes < 0) {
      lista.push({
        tipo: 'perigo',
        texto: `Atenção: Saldo projetado negativo no fim do mês atual (${formatarMoeda(projecoesSaldo.fimMes)}).`,
      });
    }

    // Alerta de concentração de cliente (> 30% da receita)
    rankingClientes.forEach((cli) => {
      if (cli.concentracaoPct > 35 && cli.nome !== 'Avulso / Sem cliente') {
        lista.push({
          tipo: 'aviso',
          texto: `Concentração alta: ${cli.nome} representa ${formatarPorcentagem(cli.concentracaoPct)} da receita no período.`,
        });
      }
    });

    // Alerta de despesas acima do orçado no mês
    if (metricasMesAtual.despRealizada > metricasMesAtual.despOrcada && metricasMesAtual.despOrcada > 0) {
      lista.push({
        tipo: 'perigo',
        texto: `Despesas realizadas no mês superaram o orçado em ${formatarMoeda(metricasMesAtual.despRealizada - metricasMesAtual.despOrcada)}.`,
      });
    }

    // Alerta de recebimentos atrasados
    const totalAtrasado = lancamentosVencidos
      .filter((l) => l.tipo === 'receita')
      .reduce((acc, l) => acc + l.valorOrcado, 0);
    if (totalAtrasado > 0) {
      lista.push({
        tipo: 'aviso',
        texto: `Existem ${formatarMoeda(totalAtrasado)} em receitas com vencimento atrasado pendentes de cobrança.`,
      });
    }

    return lista;
  }, [projecoesSaldo, rankingClientes, metricasMesAtual, lancamentosVencidos]);

  // Se o aplicativo estiver totalmente zerado:
  if (!temDados) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Painel Geral da Agência
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Visão consolidada do fluxo financeiro, orçado x realizado e projeções de caixa.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum dado financeiro registrado"
          descricao="O sistema inicia totalmente zerado para garantir a integridade dos seus dados reais. Cadastre sua primeira conta bancária ou crie seu primeiro lançamento de receita ou despesa."
          acaoTexto="Criar primeiro lançamento"
          onAcao={() => abrirModalNovoLancamento('receita')}
          secundariaTexto="Cadastrar conta bancária"
          onSecundaria={() => setActiveTab('configuracoes')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Título & Alertas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Dashboard Financeiro
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Acompanhamento gerencial consolidado e indicadores de liquidez.
          </p>
        </div>

        <button
          type="button"
          onClick={() => abrirModalNovoLancamento('despesa')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-primaria hover:bg-primaria-hover text-white text-xs sm:text-sm font-semibold rounded-[var(--radius-controle)] shadow-card cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Faixa de Alertas Automáticos */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-[var(--radius-card)] border text-xs font-medium ${
                alerta.tipo === 'perigo'
                  ? 'bg-perigo-suave dark:bg-superficie-dark/40 border-perigo dark:border-borda-dark/60 text-perigo dark:text-texto-forte-dark'
                  : 'bg-alerta-suave dark:bg-superficie-dark/40 border-alerta dark:border-borda-dark/60 text-alerta dark:text-texto-forte-dark'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{alerta.texto}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Consolidado */}
        <button type="button" onClick={() => setDetalheCard('saldo')} className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-2 text-left cursor-pointer hover:border-primaria dark:hover:border-primaria hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-texto-medio dark:text-texto-medio-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Consolidado</span>
            <Wallet className="w-4 h-4 text-primaria" />
          </div>
          <div className="text-2xl font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
            {formatarMoeda(saldoConsolidado)}
          </div>
          <div className="text-[11px] text-texto-medio dark:text-texto-medio-dark">
            {contas.filter((c) => c.ativa).length} contas bancárias ativas
          </div>
        </button>

        {/* Card 2: Receitas do Mês */}
        <button type="button" onClick={() => setDetalheCard('receitas')} className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-2 text-left cursor-pointer hover:border-sucesso dark:hover:border-sucesso hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-texto-medio dark:text-texto-medio-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Receitas do Mês</span>
            <ArrowUpRight className="w-4 h-4 text-sucesso" />
          </div>
          <div className="text-2xl font-bold text-sucesso dark:text-texto-forte-dark tabular-nums">
            {formatarMoeda(metricasMesAtual.recRealizada)}
          </div>
          <div className="text-[11px] text-texto-medio dark:text-texto-medio-dark flex items-center justify-between">
            <span>Orçado: {formatarMoeda(metricasMesAtual.recOrcada)}</span>
            <span className="font-medium text-sucesso dark:text-texto-forte-dark">
              {metricasMesAtual.recOrcada > 0
                ? formatarPorcentagem((metricasMesAtual.recRealizada / metricasMesAtual.recOrcada) * 100)
                : '-'}
            </span>
          </div>
        </button>

        {/* Card 3: Despesas do Mês */}
        <button type="button" onClick={() => setDetalheCard('despesas')} className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-2 text-left cursor-pointer hover:border-perigo dark:hover:border-perigo hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-texto-medio dark:text-texto-medio-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas do Mês</span>
            <ArrowDownRight className="w-4 h-4 text-perigo" />
          </div>
          <div className="text-2xl font-bold text-perigo dark:text-texto-forte-dark tabular-nums">
            {formatarMoeda(metricasMesAtual.despRealizada)}
          </div>
          <div className="text-[11px] text-texto-medio dark:text-texto-medio-dark flex items-center justify-between">
            <span>Orçado: {formatarMoeda(metricasMesAtual.despOrcada)}</span>
            <span className="font-medium text-perigo dark:text-texto-forte-dark">
              {metricasMesAtual.despOrcada > 0
                ? formatarPorcentagem((metricasMesAtual.despRealizada / metricasMesAtual.despOrcada) * 100)
                : '-'}
            </span>
          </div>
        </button>

        {/* Card 4: Resultado & Margem */}
        <button type="button" onClick={() => setDetalheCard('resultado')} className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-2 text-left cursor-pointer hover:border-primaria dark:hover:border-primaria hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-texto-medio dark:text-texto-medio-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Resultado do Mês</span>
            <Percent className="w-4 h-4 text-primaria" />
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              metricasMesAtual.resultadoRealizado >= 0
                ? 'text-sucesso dark:text-texto-forte-dark'
                : 'text-perigo dark:text-texto-forte-dark'
            }`}
          >
            {formatarMoeda(metricasMesAtual.resultadoRealizado)}
          </div>
          <div className="text-[11px] text-texto-medio dark:text-texto-medio-dark flex items-center justify-between">
            <span>Margem Líquida</span>
            <span className="font-bold text-texto-medio dark:text-texto-medio-dark">
              {formatarPorcentagem(metricasMesAtual.margemRealizada)}
            </span>
          </div>
        </button>
      </div>

      {/* Linha de Projeções de Saldo & MRR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-[var(--radius-card)] bg-fundo-sutil dark:bg-superficie-dark/50 border border-borda dark:border-borda-dark">
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">MRR Clientes Ativos</span>
          <span className="text-base font-bold text-primaria dark:text-primaria-clara tabular-nums">
            {formatarMoeda(mrrTotal)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">Projetado Fim do Mês</span>
          <span
            className={`text-base font-bold tabular-nums ${
              projecoesSaldo.fimMes >= 0 ? 'text-texto-medio dark:text-texto-medio-dark' : 'text-perigo'
            }`}
          >
            {formatarMoeda(projecoesSaldo.fimMes)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">Projetado em 3 Meses</span>
          <span
            className={`text-base font-bold tabular-nums ${
              projecoesSaldo.tresMeses >= 0 ? 'text-texto-medio dark:text-texto-medio-dark' : 'text-perigo'
            }`}
          >
            {formatarMoeda(projecoesSaldo.tresMeses)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">Projetado em 6 Meses</span>
          <span
            className={`text-base font-bold tabular-nums ${
              projecoesSaldo.seisMeses >= 0 ? 'text-texto-medio dark:text-texto-medio-dark' : 'text-perigo'
            }`}
          >
            {formatarMoeda(projecoesSaldo.seisMeses)}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">Projetado em 12 Meses</span>
          <span
            className={`text-base font-bold tabular-nums ${
              projecoesSaldo.dozeMeses >= 0 ? 'text-texto-medio dark:text-texto-medio-dark' : 'text-perigo'
            }`}
          >
            {formatarMoeda(projecoesSaldo.dozeMeses)}
          </span>
        </div>
      </div>

      {/* Gráficos: Orçado x Realizado & Saldo Acumulado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Barras de Orçado x Realizado */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Orçado × Realizado Mensal (R$)
            </h3>
            <span className="text-xs text-texto-medio">Receitas e Despesas</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => formatarMoeda(Number(val) * 100)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="recRealizada" name="Receita Realizada" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recOrcada" name="Receita Orçada" fill="#a7f3d0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despRealizada" name="Despesa Realizada" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despOrcada" name="Despesa Orçada" fill="#fecaca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Linha de Saldo Acumulado com Destaque de Negativo */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Evolução do Saldo Acumulado (R$)
            </h3>
            <span className="text-xs text-texto-medio">Realizado × Projetado</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosSaldoAcumulado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => formatarMoeda(Number(val) * 100)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo Acumulado"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Linha 2 de Gráficos: Rosca de Despesas & Ranking de Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Rosca: Despesas por Grupo */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Despesas por Grupo no Período
          </h3>
          {dadosDespesasPorGrupo.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-texto-medio">
              Nenhuma despesa registrada no período selecionado.
            </div>
          ) : (
            <div className="h-56 flex items-center justify-between">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosDespesasPorGrupo}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosDespesasPorGrupo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatarMoeda(Number(val) * 100)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2 text-xs">
                {dadosDespesasPorGrupo.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.cor }} />
                      <span className="text-texto-medio dark:text-texto-medio-dark truncate">{g.name}</span>
                    </div>
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                      {formatarMoeda(g.value * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ranking de Receita por Cliente */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Concentração de Receita por Cliente
            </h3>
            <span className="text-xs text-texto-medio">Top 5</span>
          </div>

          {rankingClientes.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-texto-medio">
              Nenhuma receita com cliente registrada no período.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {rankingClientes.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-texto-medio dark:text-texto-medio-dark truncate">
                      {c.nome}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sucesso dark:text-texto-forte-dark tabular-nums">
                        {formatarMoeda(c.valor)}
                      </span>
                      <span className="text-texto-medio tabular-nums text-[11px] w-12 text-right">
                        {formatarPorcentagem(c.concentracaoPct)}
                      </span>
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-fundo-sutil dark:bg-superficie-dark rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.concentracaoPct > 35 ? 'bg-alerta-suave0' : 'bg-primaria'
                      }`}
                      style={{ width: `${Math.min(100, c.concentracaoPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listas Operacionais: Próximos 7 dias & Vencidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista 1: Próximos 7 Dias */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primaria" />
              <span>Próximos 7 Dias</span>
            </h3>
            <span className="text-xs text-texto-medio">{proximos7Dias.length} itens</span>
          </div>

          {proximos7Dias.length === 0 ? (
            <div className="py-8 text-center text-xs text-texto-medio">
              Nenhum lançamento previsto para os próximos 7 dias.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {proximos7Dias.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block truncate">
                      {l.descricao}
                    </span>
                    <span className="text-texto-medio text-[10px]">
                      Venc: {formatarDataBR(l.dataVencimento)} • {l.subcategoria}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold tabular-nums block ${
                        l.tipo === 'receita'
                          ? 'text-sucesso dark:text-texto-forte-dark'
                          : 'text-perigo dark:text-texto-forte-dark'
                      }`}
                    >
                      {formatarMoeda(l.valorOrcado)}
                    </span>
                    <button
                      type="button"
                      onClick={() => marcarComoRealizadoRapido(l.id)}
                      className="text-[10px] text-primaria dark:text-primaria-clara hover:underline font-medium cursor-pointer"
                    >
                      Dar baixa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista 2: Lançamentos Vencidos */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-perigo dark:text-texto-forte-dark flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Lançamentos Vencidos</span>
            </h3>
            <span className="text-xs text-perigo font-semibold">{lancamentosVencidos.length}</span>
          </div>

          {lancamentosVencidos.length === 0 ? (
            <div className="py-8 text-center text-xs text-sucesso dark:text-texto-forte-dark flex flex-col items-center gap-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>Nenhum lançamento vencido. Tudo em dia!</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lancamentosVencidos.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 rounded-[var(--radius-controle)] bg-perigo-suave/50 dark:bg-superficie-dark/30 border border-perigo dark:border-borda-dark/40 text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block truncate">
                      {l.descricao}
                    </span>
                    <span className="text-perigo text-[10px] font-medium">
                      Venceu em: {formatarDataBR(l.dataVencimento)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold tabular-nums block ${
                        l.tipo === 'receita'
                          ? 'text-sucesso dark:text-texto-forte-dark'
                          : 'text-perigo dark:text-texto-forte-dark'
                      }`}
                    >
                      {formatarMoeda(l.valorOrcado)}
                    </span>
                    <button
                      type="button"
                      onClick={() => marcarComoRealizadoRapido(l.id)}
                      className="text-[10px] text-primaria dark:text-primaria-clara hover:underline font-medium cursor-pointer"
                    >
                      Realizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista 3: Contratos vencendo em 60 dias */}
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark flex items-center gap-2">
              <Users className="w-4 h-4 text-primaria" />
              <span>Contratos Expirando (60 dias)</span>
            </h3>
            <span className="text-xs text-texto-medio">{contratosTerminando.length}</span>
          </div>

          {contratosTerminando.length === 0 ? (
            <div className="py-8 text-center text-xs text-texto-medio">
              Nenhum contrato ativo de cliente terminando nos próximos 60 dias.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {contratosTerminando.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block truncate">
                      {c.nomeRazaoSocial}
                    </span>
                    <span className="text-texto-medio text-[10px]">
                      Fim: {formatarDataBR(c.dataFim)} • {c.planoServico}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-primaria dark:text-primaria-clara tabular-nums">
                      {formatarMoeda(c.valorMensal)}/mês
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detalheCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-fundo-sutil/50 p-4 backdrop-blur-sm"
          onClick={() => setDetalheCard(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalhe-indicador"
            className="w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-borda bg-superficie shadow-2xl dark:border-borda-dark dark:bg-navy"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-borda p-5 dark:border-borda-dark">
              <div>
                <h2 id="titulo-detalhe-indicador" className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                  {detalheCard === 'saldo' && 'Como é formado o saldo consolidado'}
                  {detalheCard === 'receitas' && 'Como são formadas as receitas do mês'}
                  {detalheCard === 'despesas' && 'Como são formadas as despesas do mês'}
                  {detalheCard === 'resultado' && 'Como é formado o resultado do mês'}
                </h2>
                <p className="mt-1 text-xs text-texto-medio dark:text-texto-medio-dark">
                  Referência: {mesReferencia.slice(5, 7)}/{mesReferencia.slice(0, 4)}
                </p>
              </div>
              <button type="button" onClick={() => setDetalheCard(null)} className="rounded-[var(--radius-controle)] p-1.5 text-texto-medio hover:bg-fundo-sutil hover:text-texto-medio dark:hover:bg-fundo-sutil dark:hover:text-texto-medio" aria-label="Fechar detalhamento">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="max-h-[78vh] space-y-5 overflow-y-auto p-6 text-sm md:p-7">
              {detalheCard === 'saldo' && (
                <>
                  <p className="text-texto-medio dark:text-texto-medio-dark">É a soma do saldo atual de cada conta bancária ativa, considerando o saldo inicial e os lançamentos vinculados a ela.</p>
                  <div className="rounded-[var(--radius-card)] bg-primaria-suave p-3 text-primaria dark:bg-navy-claro/40 dark:text-primaria-clara">
                    <span className="text-xs font-semibold uppercase">Total</span>
                    <div className="mt-1 text-2xl font-bold">{formatarMoeda(saldoConsolidado)}</div>
                  </div>
                  {saldoAsaas !== null && (
                    <div className="rounded-[var(--radius-card)] border border-primaria p-3 dark:border-borda-dark/60">
                      <div className="flex items-center justify-between text-xs"><span className="font-semibold text-texto-medio dark:text-texto-medio-dark">Saldo atual no Asaas</span><strong className="text-primaria dark:text-primaria-clara">{formatarMoeda(saldoAsaas)}</strong></div>
                      <p className="mt-1 text-[11px] text-texto-medio">Saldo retornado pela integração e atualizado no último processo de sincronização.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-card)] bg-sucesso-suave p-3 dark:bg-superficie-dark/30"><span className="text-[10px] font-semibold uppercase text-sucesso dark:text-texto-forte-dark">Entradas Asaas</span><div className="mt-1 font-bold text-sucesso dark:text-texto-forte-dark">{formatarMoeda(resumoExtratoAsaas.entradas)}</div></div>
                    <div className="rounded-[var(--radius-card)] bg-perigo-suave p-3 dark:bg-superficie-dark/30"><span className="text-[10px] font-semibold uppercase text-perigo dark:text-texto-forte-dark">Saídas Asaas</span><div className="mt-1 font-bold text-perigo dark:text-texto-forte-dark">{formatarMoeda(resumoExtratoAsaas.saidas)}</div></div>
                  </div>
                  <div className="space-y-2">
                    {contas.filter((conta) => conta.ativa).map((conta) => (
                      <div key={conta.id} className="flex items-center justify-between rounded-[var(--radius-controle)] border border-borda p-3 dark:border-borda-dark">
                        <span className="font-medium text-texto-medio dark:text-texto-medio-dark">{conta.nome}</span>
                        <span className="font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">{formatarMoeda(calcularSaldoConta(conta, lancamentos).saldoAtual)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-borda pt-4 dark:border-borda-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-texto-medio">Extrato efetivo do Asaas</h3>
                      <span className="text-xs font-medium text-texto-medio">{movimentacoesAsaasDoMes.length} movimentos</span>
                    </div>
                    <p className="mb-3 text-[11px] text-texto-medio">Movimentações que impactaram o saldo em {mesReferencia.slice(5, 7)}/{mesReferencia.slice(0, 4)}.</p>
                    <div className="space-y-2">
                      {movimentacoesAsaasDoMes.length === 0 ? (
                        <p className="rounded-[var(--radius-controle)] bg-fundo-sutil p-3 text-xs text-texto-medio dark:bg-superficie-dark">Nenhuma movimentação do Asaas foi sincronizada para este mês. Use “Sincronizar Asaas” para atualizar o extrato.</p>
                      ) : movimentacoesAsaasDoMes.map((transacao) => (
                        <div key={transacao.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-controle)] border border-borda p-3 dark:border-borda-dark">
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-texto-medio dark:text-texto-medio-dark">{transacao.descricao}</span>
                            <span className="text-xs text-texto-medio">{formatarDataBR(transacao.data)} · {transacao.valorCents >= 0 ? 'Crédito' : 'Débito'} Asaas</span>
                          </div>
                          <span className={`shrink-0 font-bold tabular-nums ${transacao.valorCents >= 0 ? 'text-sucesso' : 'text-perigo'}`}>
                            {transacao.valorCents >= 0 ? '+' : '−'} {formatarMoeda(Math.abs(transacao.valorCents))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {detalheCard === 'receitas' && (
                <>
                  <p className="text-texto-medio dark:text-texto-medio-dark">Soma das receitas realizadas no mês selecionado. O valor orçado representa as receitas previstas para a mesma competência.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-card)] bg-sucesso-suave p-3 text-sucesso dark:bg-superficie-dark/40 dark:text-texto-forte-dark"><span className="text-xs font-semibold uppercase">Realizado</span><div className="mt-1 text-xl font-bold">{formatarMoeda(metricasMesAtual.recRealizada)}</div></div>
                    <div className="rounded-[var(--radius-card)] bg-fundo-sutil p-3 text-texto-medio dark:bg-superficie-dark dark:text-texto-medio-dark"><span className="text-xs font-semibold uppercase">Orçado</span><div className="mt-1 text-xl font-bold">{formatarMoeda(metricasMesAtual.recOrcada)}</div></div>
                  </div>
                  <p className="text-xs text-texto-medio">Lançamentos realizados: {lancamentos.filter((l) => l.tipo === 'receita' && l.mesCompetencia === mesReferencia && l.status !== 'cancelado' && (l.valorRealizado !== undefined || l.status === 'realizado')).length}. Entradas no extrato Asaas: {creditosAsaasDoMes.length}.</p>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-texto-medio">Entradas no extrato Asaas</h3>
                    {creditosAsaasDoMes.length === 0 ? <p className="text-xs text-texto-medio">Nenhuma entrada do Asaas foi sincronizada para este mês.</p> : creditosAsaasDoMes.map((transacao) => (
                      <div key={transacao.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-controle)] border border-borda p-3 dark:border-borda-dark">
                        <div className="min-w-0"><span className="block truncate font-medium text-texto-medio dark:text-texto-medio-dark">{transacao.descricao}</span><span className="text-xs text-texto-medio">{formatarDataBR(transacao.data)} · Crédito Asaas</span></div>
                        <span className="shrink-0 font-bold tabular-nums text-sucesso">{formatarMoeda(transacao.valorCents)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {detalheCard === 'despesas' && (
                <>
                  <p className="text-texto-medio dark:text-texto-medio-dark">Soma dos débitos efetivados no extrato Asaas e de despesas realizadas que ainda não estejam representadas nesse extrato. Assim, a mesma saída não é contada duas vezes.</p>
                  <div className="rounded-[var(--radius-card)] bg-perigo-suave p-3 text-perigo dark:bg-superficie-dark/40 dark:text-texto-forte-dark"><span className="text-xs font-semibold uppercase">Total realizado</span><div className="mt-1 text-2xl font-bold">{formatarMoeda(metricasMesAtual.despRealizada)}</div></div>
                  <div className="space-y-2">
                    {debitosAsaasDoMes.length === 0 ? <p className="text-xs text-texto-medio">Nenhum débito do Asaas foi sincronizado para este mês.</p> : debitosAsaasDoMes.map((transacao) => (
                      <div key={transacao.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-controle)] border border-borda p-3 dark:border-borda-dark">
                        <div className="min-w-0"><span className="block truncate font-medium text-texto-medio dark:text-texto-medio-dark">{transacao.descricao}</span><span className="text-xs text-texto-medio">{formatarDataBR(transacao.data)} · Extrato Asaas</span></div>
                        <span className="shrink-0 font-bold tabular-nums text-perigo">{formatarMoeda(Math.abs(transacao.valorCents))}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {detalheCard === 'resultado' && (
                <>
                  <p className="text-texto-medio dark:text-texto-medio-dark">Resultado líquido do mês é a diferença entre receitas realizadas e despesas realizadas.</p>
                  <div className="rounded-[var(--radius-card)] bg-fundo-sutil p-4 dark:bg-superficie-dark">
                    <div className="flex justify-between"><span>Receitas realizadas</span><strong className="text-sucesso">{formatarMoeda(metricasMesAtual.recRealizada)}</strong></div>
                    <div className="mt-2 flex justify-between"><span>Despesas realizadas</span><strong className="text-perigo">− {formatarMoeda(metricasMesAtual.despRealizada)}</strong></div>
                    <div className="mt-3 flex justify-between border-t border-borda pt-3 font-bold dark:border-borda-dark"><span>Resultado</span><span>{formatarMoeda(metricasMesAtual.resultadoRealizado)}</span></div>
                  </div>
                  <p className="text-xs text-texto-medio">Margem líquida: {formatarPorcentagem(metricasMesAtual.margemRealizada)}. Ela compara o resultado com as receitas realizadas.</p>
                  <div className="rounded-[var(--radius-card)] border border-borda p-3 dark:border-borda-dark">
                    <div className="flex items-center justify-between text-xs font-semibold text-texto-medio dark:text-texto-medio-dark"><span>Variação no extrato Asaas</span><span>{formatarMoeda(resumoExtratoAsaas.entradas - resumoExtratoAsaas.saidas)}</span></div>
                    <p className="mt-1 text-[11px] text-texto-medio">{movimentacoesAsaasDoMes.length} movimentações sincronizadas no período: {creditosAsaasDoMes.length} entradas e {debitosAsaasDoMes.length} saídas.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-texto-medio">Extrato efetivo do Asaas</h3>
                    {movimentacoesAsaasDoMes.length === 0 ? <p className="text-xs text-texto-medio">Nenhuma movimentação foi sincronizada para este mês.</p> : movimentacoesAsaasDoMes.map((transacao) => (
                      <div key={transacao.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-controle)] border border-borda p-3 dark:border-borda-dark">
                        <div className="min-w-0"><span className="block truncate font-medium text-texto-medio dark:text-texto-medio-dark">{transacao.descricao}</span><span className="text-xs text-texto-medio">{formatarDataBR(transacao.data)} · Extrato Asaas</span></div>
                        <span className={`shrink-0 font-bold tabular-nums ${transacao.valorCents >= 0 ? 'text-sucesso' : 'text-perigo'}`}>{transacao.valorCents >= 0 ? '+' : '−'} {formatarMoeda(Math.abs(transacao.valorCents))}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
