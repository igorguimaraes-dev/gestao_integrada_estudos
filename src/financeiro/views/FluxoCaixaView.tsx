import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Table,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  formatarMoeda,
  formatarDataBR,
  formatarMesCompetencia,
  getMesAtualISO,
} from '../utils/formatters';
import { calcularSaldoConta, obterValorEfetivoLancamento } from '../utils/calculations';

export const FluxoCaixaView: React.FC = () => {
  const {
    lancamentos,
    contas,
    mesSelecionado,
    anoSelecionado,
    mesesDoPeriodoAtual,
    abrirModalNovoLancamento,
  } = useApp();

  // Visão Mensal vs Diária
  const [modoVisao, setModoVisao] = useState<'mensal' | 'diario'>('mensal');

  // Saldo inicial consolidado
  const saldoInicialConsolidado = useMemo(() => {
    return contas
      .filter((c) => c.ativa)
      .reduce((acc, c) => acc + c.saldoInicial, 0);
  }, [contas]);

  // Saldo atual real dos bancos
  const saldoRealAtual = useMemo(() => {
    return contas
      .filter((c) => c.ativa)
      .reduce((acc, c) => acc + calcularSaldoConta(c, lancamentos).saldoAtual, 0);
  }, [contas, lancamentos]);

  // 1. CÁLCULO DA VISÃO MENSAL DO FLUXO DE CAIXA
  const dadosMensais = useMemo(() => {
    let saldoAcumulado = saldoInicialConsolidado;

    return mesesDoPeriodoAtual.map((mes) => {
      const saldoInicialMes = saldoAcumulado;
      let entradas = 0;
      let saidas = 0;
      let transferencias = 0;

      // Agrupamentos
      const entradasPorGrupo: Record<string, number> = {};
      const saidasPorGrupo: Record<string, number> = {};

      lancamentos.forEach((l) => {
        if (l.status === 'cancelado') return;
        const refMes = l.mesCompetencia;

        if (refMes === mes) {
          const val = obterValorEfetivoLancamento(l);

          if (l.tipo === 'receita') {
            entradas += val;
            const g = l.grupo || 'Receitas';
            entradasPorGrupo[g] = (entradasPorGrupo[g] || 0) + val;
          } else if (l.tipo === 'despesa') {
            saidas += val;
            const g = l.grupo || 'Despesas';
            saidasPorGrupo[g] = (saidasPorGrupo[g] || 0) + val;
          } else if (l.tipo === 'transferencia') {
            transferencias += val;
          }
        }
      });

      const resultadoOperacional = entradas - saidas;
      saldoAcumulado = saldoInicialMes + resultadoOperacional;

      return {
        mes,
        mesLabel: formatarMesCompetencia(mes),
        saldoInicial: saldoInicialMes,
        entradas,
        saidas,
        transferencias,
        resultadoOperacional,
        saldoFinal: saldoAcumulado,
        isNegativo: saldoAcumulado < 0,
        entradasPorGrupo,
        saidasPorGrupo,
      };
    });
  }, [mesesDoPeriodoAtual, lancamentos, saldoInicialConsolidado]);

  // 2. CÁLCULO DA VISÃO DIÁRIA DO MÊS SELECIONADO
  const dadosDiarios = useMemo(() => {
    const [anoStr, mesStr] = (mesSelecionado || getMesAtualISO()).split('-');
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const totalDias = new Date(ano, mes, 0).getDate();

    let saldoDia = saldoInicialConsolidado;
    const dias = [];

    for (let d = 1; d <= totalDias; d++) {
      const diaFormatado = `${anoStr}-${mesStr}-${String(d).padStart(2, '0')}`;
      const saldoInicialDia = saldoDia;
      let entradas = 0;
      let saidas = 0;

      lancamentos.forEach((l) => {
        if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
        // Considera a data de vencimento ou data de pagamento se já realizado
        const dataEfetiva = l.dataPagamento || l.dataVencimento;

        if (dataEfetiva === diaFormatado) {
          const val = obterValorEfetivoLancamento(l);
          if (l.tipo === 'receita') entradas += val;
          else if (l.tipo === 'despesa') saidas += val;
        }
      });

      const resultadoDia = entradas - saidas;
      saldoDia = saldoInicialDia + resultadoDia;

      dias.push({
        data: diaFormatado,
        diaNumero: d,
        saldoInicial: saldoInicialDia,
        entradas,
        saidas,
        resultadoDia,
        saldoFinal: saldoDia,
        isNegativo: saldoDia < 0,
      });
    }

    return dias;
  }, [mesSelecionado, lancamentos, saldoInicialConsolidado]);

  // Dados para o Gráfico de Linha do Saldo Diário ou Mensal
  const dadosGraficoLinha = useMemo(() => {
    if (modoVisao === 'mensal') {
      return dadosMensais.map((m) => ({
        label: m.mes.split('-')[1] + '/' + m.mes.split('-')[0].slice(2),
        saldo: Math.round(m.saldoFinal / 100),
      }));
    } else {
      return dadosDiarios.map((d) => ({
        label: `${d.diaNumero}`,
        saldo: Math.round(d.saldoFinal / 100),
      }));
    }
  }, [modoVisao, dadosMensais, dadosDiarios]);

  // Se não houver nenhum lançamento
  if (lancamentos.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Fluxo de Caixa Operacional
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Acompanhe o saldo acumulado diário e mensal e previna quebras de caixa.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum movimento registrado"
          descricao="O fluxo de caixa projeta a liquidez futura a partir dos vencimentos e pagamentos da agência. Crie o primeiro lançamento para visualizar as projeções."
          acaoTexto="Criar primeiro lançamento"
          onAcao={() => abrirModalNovoLancamento('despesa')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Fluxo de Caixa
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Saldo acumulado, conciliação e linha do tempo de liquidez.
          </p>
        </div>

        {/* Alternador de Visão Mensal vs Diária */}
        <div className="inline-flex p-0.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark text-xs font-medium">
          <button
            type="button"
            onClick={() => setModoVisao('mensal')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
              modoVisao === 'mensal'
                ? 'bg-superficie dark:bg-superficie-dark text-primaria dark:text-primaria-clara font-semibold shadow-sutil'
                : 'text-texto-medio dark:text-texto-medio-dark'
            }`}
          >
            Visão Mensal ({anoSelecionado})
          </button>
          <button
            type="button"
            onClick={() => setModoVisao('diario')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
              modoVisao === 'diario'
                ? 'bg-superficie dark:bg-superficie-dark text-primaria dark:text-primaria-clara font-semibold shadow-sutil'
                : 'text-texto-medio dark:text-texto-medio-dark'
            }`}
          >
            Visão Diária ({formatarMesCompetencia(mesSelecionado)})
          </button>
        </div>
      </div>

      {/* Gráfico de Linha do Saldo Acumulado */}
      <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Linha do Tempo: Saldo Acumulado Projetado (R$)
          </h3>
          <span className="text-xs text-texto-medio">
            {modoVisao === 'mensal' ? 'Ao final de cada mês' : 'Ao final de cada dia'}
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosGraficoLinha} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any) => formatarMoeda(Number(val) * 100)}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo Final"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VISÃO MENSAL: MATRIZ DE MESES */}
      {modoVisao === 'mensal' && (
        <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark font-semibold text-[10px] uppercase tracking-wider">
                  <th className="p-3 sticky left-0 bg-fundo-sutil dark:bg-superficie-dark z-10 min-w-44">
                    Indicador / Mês
                  </th>
                  {dadosMensais.map((m) => (
                    <th key={m.mes} className="p-3 text-right min-w-28">
                      {m.mes.split('-')[1]}/{m.mes.split('-')[0].slice(2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {/* Saldo Inicial */}
                <tr className="bg-fundo-sutil/50 dark:bg-superficie-dark/30 font-medium">
                  <td className="p-3 sticky left-0 bg-fundo-sutil/90 dark:bg-superficie-dark/90 font-semibold text-texto-medio dark:text-texto-medio-dark">
                    (+) Saldo Inicial
                  </td>
                  {dadosMensais.map((m) => (
                    <td key={m.mes} className="p-3 text-right tabular-nums text-texto-medio dark:text-texto-medio-dark">
                      {formatarMoeda(m.saldoInicial)}
                    </td>
                  ))}
                </tr>

                {/* Total Entradas */}
                <tr className="text-sucesso dark:text-texto-forte-dark font-medium">
                  <td className="p-3 sticky left-0 bg-superficie dark:bg-navy font-semibold">
                    (+) Total de Entradas
                  </td>
                  {dadosMensais.map((m) => (
                    <td key={m.mes} className="p-3 text-right tabular-nums font-semibold">
                      {formatarMoeda(m.entradas)}
                    </td>
                  ))}
                </tr>

                {/* Total Saídas */}
                <tr className="text-perigo dark:text-texto-forte-dark font-medium">
                  <td className="p-3 sticky left-0 bg-superficie dark:bg-navy font-semibold">
                    (-) Total de Saídas
                  </td>
                  {dadosMensais.map((m) => (
                    <td key={m.mes} className="p-3 text-right tabular-nums font-semibold">
                      {formatarMoeda(m.saidas)}
                    </td>
                  ))}
                </tr>

                {/* Resultado Operacional */}
                <tr className="font-semibold bg-fundo-sutil/80 dark:bg-superficie-dark/50">
                  <td className="p-3 sticky left-0 bg-fundo-sutil dark:bg-superficie-dark font-bold text-texto-medio dark:text-texto-medio-dark">
                    (=) Resultado Operacional
                  </td>
                  {dadosMensais.map((m) => (
                    <td
                      key={m.mes}
                      className={`p-3 text-right tabular-nums font-bold ${
                        m.resultadoOperacional >= 0
                          ? 'text-sucesso dark:text-texto-forte-dark'
                          : 'text-perigo dark:text-texto-forte-dark'
                      }`}
                    >
                      {formatarMoeda(m.resultadoOperacional)}
                    </td>
                  ))}
                </tr>

                {/* Saldo Final Acumulado */}
                <tr className="border-t-2 border-borda-forte dark:border-borda-dark font-bold">
                  <td className="p-3 sticky left-0 bg-superficie dark:bg-navy font-black text-texto-medio dark:text-texto-medio-dark">
                    (=) Saldo Final Acumulado
                  </td>
                  {dadosMensais.map((m) => (
                    <td
                      key={m.mes}
                      className={`p-3 text-right tabular-nums font-black ${
                        m.saldoFinal >= 0
                          ? 'text-texto-medio dark:text-texto-medio-dark'
                          : 'text-perigo dark:text-texto-forte-dark bg-perigo-suave/50 dark:bg-superficie-dark/30'
                      }`}
                    >
                      {formatarMoeda(m.saldoFinal)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISÃO DIÁRIA: TABELA DIA A DIA */}
      {modoVisao === 'diario' && (
        <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark font-semibold text-[10px] uppercase tracking-wider">
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Saldo Inicial (R$)</th>
                  <th className="p-3 text-right text-sucesso dark:text-texto-forte-dark">Entradas (R$)</th>
                  <th className="p-3 text-right text-perigo dark:text-texto-forte-dark">Saídas (R$)</th>
                  <th className="p-3 text-right">Resultado do Dia</th>
                  <th className="p-3 text-right font-bold">Saldo Final (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dadosDiarios.map((dia) => (
                  <tr
                    key={dia.data}
                    className={`hover:bg-fundo-sutil/80 dark:hover:bg-fundo-sutil/40 transition-colors ${
                      dia.isNegativo ? 'bg-perigo-suave/30 dark:bg-superficie-dark/20' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                      {formatarDataBR(dia.data)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-texto-medio dark:text-texto-medio-dark">
                      {formatarMoeda(dia.saldoInicial)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-sucesso dark:text-texto-forte-dark font-semibold">
                      {dia.entradas > 0 ? formatarMoeda(dia.entradas) : '-'}
                    </td>
                    <td className="p-3 text-right tabular-nums text-perigo dark:text-texto-forte-dark font-semibold">
                      {dia.saidas > 0 ? formatarMoeda(dia.saidas) : '-'}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums font-semibold ${
                        dia.resultadoDia > 0
                          ? 'text-sucesso'
                          : dia.resultadoDia < 0
                          ? 'text-perigo'
                          : 'text-texto-medio'
                      }`}
                    >
                      {formatarMoeda(dia.resultadoDia)}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums font-bold ${
                        dia.saldoFinal >= 0
                          ? 'text-texto-medio dark:text-texto-medio-dark'
                          : 'text-perigo dark:text-texto-forte-dark'
                      }`}
                    >
                      {formatarMoeda(dia.saldoFinal)}
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
