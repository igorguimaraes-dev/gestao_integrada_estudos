import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatarMoeda,
  formatarPorcentagem,
  formatarDataBR,
  getMesAtualISO,
} from '../utils/formatters';
import {
  obterValorEfetivoLancamento,
  calcularMatrizDREPeriodos,
  MatrizDRECompleta,
} from '../utils/calculations';

export const RelatoriosView: React.FC = () => {
  const {
    lancamentos,
    clientes,
    categorias,
    anoSelecionado,
    regime,
    mesesDoPeriodoAtual,
    showToast,
  } = useApp();

  const [tipoRelatorio, setTipoRelatorio] = useState<'dre' | 'inadimplencia' | 'rentabilidade'>('dre');

  // 1. DRE Gerencial Multi-período (Mês a Mês do Ano + Totalizador)
  const mesesDRE = useMemo(() => {
    if (mesesDoPeriodoAtual && mesesDoPeriodoAtual.length > 1) {
      return mesesDoPeriodoAtual;
    }
    return Array.from({ length: 12 }, (_, i) => `${anoSelecionado}-${String(i + 1).padStart(2, '0')}`);
  }, [mesesDoPeriodoAtual, anoSelecionado]);

  const matrizDRE: MatrizDRECompleta = useMemo(() => {
    return calcularMatrizDREPeriodos(lancamentos, categorias, mesesDRE, regime);
  }, [lancamentos, categorias, mesesDRE, regime]);

  // 2. Relatório de Inadimplência
  const clientesInadimplentes = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const atrasados = lancamentos.filter(
      (l) =>
        l.tipo === 'receita' &&
        l.status !== 'cancelado' &&
        (l.status === 'vencido' || (l.status === 'previsto' && l.dataVencimento < hoje))
    );

    return atrasados.map((l) => {
      const cli = clientes.find((c) => c.id === l.clienteId);
      const diffMs = new Date().getTime() - new Date(l.dataVencimento).getTime();
      const diasAtraso = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: l.id,
        clienteNome: cli?.nomeFantasia || cli?.nomeRazaoSocial || l.descricao,
        emailFinanceiro: cli?.emailFinanceiro || 'Não informado',
        telefone: cli?.telefone || 'Não informado',
        dataVencimento: l.dataVencimento,
        diasAtraso,
        valorDevido: l.valorOrcado,
        descricao: l.descricao,
      };
    });
  }, [lancamentos, clientes]);

  const totalInadimplente = useMemo(() => {
    return clientesInadimplentes.reduce((acc, c) => acc + c.valorDevido, 0);
  }, [clientesInadimplentes]);

  // 3. Rentabilidade por Cliente (Margem de Contribuição)
  const rentabilidadeClientes = useMemo(() => {
    return clientes.map((c) => {
      let receitaTotal = 0;
      lancamentos.forEach((l) => {
        if (l.clienteId === c.id && l.tipo === 'receita' && l.status !== 'cancelado') {
          receitaTotal += obterValorEfetivoLancamento(l);
        }
      });

      let custoAlocado = 0;
      lancamentos.forEach((l) => {
        if (
          l.tipo === 'despesa' &&
          l.status !== 'cancelado' &&
          (l.descricao.toLowerCase().includes(c.nomeRazaoSocial.toLowerCase()) ||
            (c.nomeFantasia && l.descricao.toLowerCase().includes(c.nomeFantasia.toLowerCase())))
        ) {
          custoAlocado += obterValorEfetivoLancamento(l);
        }
      });

      // Se não houver despesa vinculada diretamente por texto, estima 30% como custo de equipe padrão
      if (custoAlocado === 0 && receitaTotal > 0) {
        custoAlocado = Math.round(receitaTotal * 0.35);
      }

      const margemContribuicao = receitaTotal - custoAlocado;
      const margemPercentual = receitaTotal > 0 ? (margemContribuicao / receitaTotal) * 100 : 0;

      return {
        clienteId: c.id,
        clienteNome: c.nomeFantasia || c.nomeRazaoSocial,
        receitaTotal,
        custoAlocado,
        margemContribuicao,
        margemPercentual,
      };
    });
  }, [clientes, lancamentos]);

  // Exportação para Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (tipoRelatorio === 'dre') {
      const dadosExport: any[] = [];
      matrizDRE.linhas.forEach((linha) => {
        const item: any = { Descrição: linha.descricao };
        matrizDRE.meses.forEach((mes) => {
          item[mes] = (linha.valoresPorMes[mes]?.realizado || 0) / 100;
        });
        item['Total Realizado'] = (linha.total.realizado || 0) / 100;
        dadosExport.push(item);
      });
      const ws = XLSX.utils.json_to_sheet(dadosExport);
      XLSX.utils.book_append_sheet(wb, ws, 'DRE Gerencial');
      XLSX.writeFile(wb, `DRE_Gerencial_${anoSelecionado}.xlsx`);
    } else if (tipoRelatorio === 'inadimplencia') {
      const ws = XLSX.utils.json_to_sheet(
        clientesInadimplentes.map((c) => ({
          Cliente: c.clienteNome,
          Descrição: c.descricao,
          Vencimento: formatarDataBR(c.dataVencimento),
          'Dias de Atraso': c.diasAtraso,
          'Valor Devido (R$)': c.valorDevido / 100,
          'E-mail': c.emailFinanceiro,
          Telefone: c.telefone,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, 'Inadimplência');
      XLSX.writeFile(wb, `Relatorio_Inadimplencia_${getMesAtualISO()}.xlsx`);
    } else {
      const ws = XLSX.utils.json_to_sheet(
        rentabilidadeClientes.map((r) => ({
          Cliente: r.clienteNome,
          'Receita Total (R$)': r.receitaTotal / 100,
          'Custos Alocados (R$)': r.custoAlocado / 100,
          'Margem Contribuição (R$)': r.margemContribuicao / 100,
          'Margem (%)': r.margemPercentual.toFixed(1) + '%',
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, 'Rentabilidade');
      XLSX.writeFile(wb, `Rentabilidade_Clientes_${anoSelecionado}.xlsx`);
    }

    showToast('Planilha Excel (.xlsx) exportada com sucesso!');
  };

  // Exportação para PDF formatado
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: tipoRelatorio === 'dre' ? 'landscape' : 'portrait' });

    doc.setFontSize(14);
    doc.text(`Relatório Financeiro: ${tipoRelatorio.toUpperCase()}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Período / Ano: ${anoSelecionado} • Regime: ${regime.toUpperCase()}`, 14, 22);

    if (tipoRelatorio === 'dre') {
      const headers = ['Descrição', ...matrizDRE.meses.map((m) => m.split('-')[1]), 'Total'];
      const rows = matrizDRE.linhas.map((l) => [
        l.descricao,
        ...matrizDRE.meses.map((m) => formatarMoeda(l.valoresPorMes[m]?.realizado || 0)),
        formatarMoeda(l.total.realizado || 0),
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
      });
    } else if (tipoRelatorio === 'inadimplencia') {
      const headers = ['Cliente', 'Vencimento', 'Atraso', 'Valor Devido', 'Contato'];
      const rows = clientesInadimplentes.map((c) => [
        c.clienteNome,
        formatarDataBR(c.dataVencimento),
        `${c.diasAtraso} dias`,
        formatarMoeda(c.valorDevido),
        c.telefone,
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'striped',
        styles: { fontSize: 9 },
      });
    } else {
      const headers = ['Cliente', 'Receita Total', 'Custos Diretos', 'Margem', '% Margem'];
      const rows = rentabilidadeClientes.map((r) => [
        r.clienteNome,
        formatarMoeda(r.receitaTotal),
        formatarMoeda(r.custoAlocado),
        formatarMoeda(r.margemContribuicao),
        formatarPorcentagem(r.margemPercentual),
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 9 },
      });
    }

    doc.save(`Relatorio_${tipoRelatorio}_${Date.now()}.pdf`);
    showToast('Documento PDF gerado com sucesso!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Relatórios e Inteligência Financeira
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            DRE gerencial estruturado mês a mês, inadimplência e rentabilidade por cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-fundo-sutil hover:bg-navy dark:bg-superficie-dark dark:hover:bg-fundo-sutil text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* Abas de Navegação de Relatórios */}
      <div className="flex items-center gap-2 border-b border-borda dark:border-borda-dark pb-2">
        <button
          type="button"
          onClick={() => setTipoRelatorio('dre')}
          className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer transition-colors ${
            tipoRelatorio === 'dre'
              ? 'bg-primaria text-white shadow-sutil'
              : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
          }`}
        >
          DRE Gerencial Completo
        </button>

        <button
          type="button"
          onClick={() => setTipoRelatorio('inadimplencia')}
          className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer transition-colors ${
            tipoRelatorio === 'inadimplencia'
              ? 'bg-primaria text-white shadow-sutil'
              : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
          }`}
        >
          Relatório de Inadimplência ({clientesInadimplentes.length})
        </button>

        <button
          type="button"
          onClick={() => setTipoRelatorio('rentabilidade')}
          className={`px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer transition-colors ${
            tipoRelatorio === 'rentabilidade'
              ? 'bg-primaria text-white shadow-sutil'
              : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
          }`}
        >
          Rentabilidade por Cliente
        </button>
      </div>

      {/* 1. DRE GERENCIAL */}
      {tipoRelatorio === 'dre' && (
        <div className="space-y-4">
          {/* Cartões Resumo Executivo da DRE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
              <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider block mb-1">
                Receita Bruta Acumulada
              </span>
              <div className="text-lg font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                {formatarMoeda(matrizDRE.resumo.receitaBruta.realizado)}
              </div>
              <span className="text-[11px] text-texto-medio">
                Orçado: {formatarMoeda(matrizDRE.resumo.receitaBruta.orcado)}
              </span>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
              <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider block mb-1">
                Margem / Lucro Bruto
              </span>
              <div className="text-lg font-bold text-sucesso dark:text-texto-forte-dark tabular-nums">
                {formatarMoeda(matrizDRE.resumo.lucroBruto.realizado)}
              </div>
              <span className="text-[11px] text-texto-medio">
                Receita Líq: {formatarMoeda(matrizDRE.resumo.receitaLiquida.realizado)}
              </span>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
              <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider block mb-1">
                EBITDA Operacional
              </span>
              <div className="text-lg font-bold text-primaria dark:text-primaria-clara tabular-nums">
                {formatarMoeda(matrizDRE.resumo.ebitda.realizado)}
              </div>
              <span className="text-[11px] text-texto-medio">
                Orçado: {formatarMoeda(matrizDRE.resumo.ebitda.orcado)}
              </span>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
              <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider block mb-1">
                Resultado Líquido (Margem)
              </span>
              <div
                className={`text-lg font-bold tabular-nums ${
                  matrizDRE.resumo.resultadoLiquido.realizado >= 0
                    ? 'text-sucesso dark:text-texto-forte-dark'
                    : 'text-perigo dark:text-texto-forte-dark'
                }`}
              >
                {formatarMoeda(matrizDRE.resumo.resultadoLiquido.realizado)}
              </div>
              <span className="text-[11px] text-texto-medio dark:text-texto-medio-dark font-semibold">
                Margem Líquida: {matrizDRE.resumo.margemLiquida.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
            <div className="p-4 border-b border-borda dark:border-borda-dark flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
                  Demonstrativo de Resultado do Exercício ({anoSelecionado})
                </h3>
                <p className="text-[11px] text-texto-medio dark:text-texto-medio-dark">
                  Visão comparativa mês a mês e acumulado sob o regime de {regime.toUpperCase()}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primaria-suave dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara border border-primaria/50 dark:border-borda-dark/40">
                Regime de {regime.toUpperCase()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark font-semibold uppercase text-[10px]">
                    <th className="p-3 sticky left-0 bg-fundo-sutil dark:bg-superficie-dark z-10 min-w-64">
                      Estrutura de Contas
                    </th>
                    {matrizDRE.meses.map((m) => (
                      <th key={m} className="p-3 text-right min-w-28 whitespace-nowrap">
                        {m.split('-')[1]}/{m.split('-')[0].slice(2)}
                      </th>
                    ))}
                    <th className="p-3 text-right min-w-32 bg-fundo-sutil/70 dark:bg-superficie-dark/90 font-bold whitespace-nowrap">
                      Total Acumulado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {matrizDRE.linhas.map((l) => (
                    <tr
                      key={l.id}
                      className={`hover:bg-fundo-sutil/50 dark:hover:bg-fundo-sutil/40 transition-colors ${
                        l.isHeader ? 'bg-fundo-sutil/80 dark:bg-superficie-dark/60 font-bold' : ''
                      } ${l.isSubtotal ? 'bg-primaria-suave/40 dark:bg-navy-claro/20 font-black' : ''}`}
                    >
                      <td
                        className={`p-3 sticky left-0 bg-inherit z-10 ${
                          l.isHeader || l.isSubtotal
                            ? 'text-texto-medio dark:text-texto-medio-dark font-bold'
                            : 'text-texto-medio dark:text-texto-medio-dark'
                        }`}
                        style={{ paddingLeft: `${12 + l.nivel * 16}px` }}
                      >
                        {l.descricao}
                      </td>
                      {matrizDRE.meses.map((m) => {
                        const val = l.valoresPorMes[m]?.realizado || 0;
                        return (
                          <td
                            key={m}
                            className={`p-3 text-right tabular-nums whitespace-nowrap ${
                              l.isSubtotal
                                ? val >= 0
                                  ? 'text-sucesso dark:text-texto-forte-dark font-bold'
                                  : 'text-perigo dark:text-texto-forte-dark font-bold'
                                : 'text-texto-medio dark:text-texto-medio-dark'
                            }`}
                          >
                            {formatarMoeda(val)}
                          </td>
                        );
                      })}
                      <td
                        className={`p-3 text-right tabular-nums font-bold whitespace-nowrap bg-fundo-sutil/50 dark:bg-superficie-dark/30 ${
                          l.isSubtotal
                            ? l.total.realizado >= 0
                              ? 'text-sucesso dark:text-texto-forte-dark font-black'
                              : 'text-perigo dark:text-texto-forte-dark font-black'
                            : 'text-texto-medio dark:text-texto-medio-dark'
                        }`}
                      >
                        {formatarMoeda(l.total.realizado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RELATÓRIO DE INADIMPLÊNCIA */}
      {tipoRelatorio === 'inadimplencia' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--radius-card)] bg-perigo-suave dark:bg-superficie-dark/30 border border-perigo dark:border-borda-dark/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-perigo" />
              <div>
                <span className="text-xs font-bold text-perigo dark:text-texto-forte-dark block">
                  Total da Inadimplência em Aberto
                </span>
                <span className="text-xl font-black text-perigo dark:text-texto-forte-dark tabular-nums">
                  {formatarMoeda(totalInadimplente)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-perigo dark:text-texto-forte-dark font-semibold block">
                {clientesInadimplentes.length} título(s) vencido(s)
              </span>
            </div>
          </div>

          <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
            <div className="p-4 border-b border-borda dark:border-borda-dark">
              <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
                Detalhamento dos Clientes com Títulos em Atraso
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-fundo-sutil dark:bg-superficie-dark/60 border-b border-borda dark:border-borda-dark text-texto-medio font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Descrição da Cobrança</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3 text-center">Dias Atraso</th>
                    <th className="p-3 text-right">Valor Devido</th>
                    <th className="p-3">Contato Financeiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {clientesInadimplentes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-texto-medio">
                        <CheckCircle2 className="w-8 h-8 text-sucesso mx-auto mb-2" />
                        <span className="font-semibold text-sm text-texto-medio dark:text-texto-medio-dark block">
                          Nenhum cliente inadimplente!
                        </span>
                        <span className="text-xs">Todos os recebimentos estão em dia.</span>
                      </td>
                    </tr>
                  ) : (
                    clientesInadimplentes.map((item) => (
                      <tr key={item.id} className="hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/40">
                        <td className="p-3 font-semibold text-texto-medio dark:text-texto-medio-dark">
                          {item.clienteNome}
                        </td>
                        <td className="p-3 text-texto-medio dark:text-texto-medio-dark">
                          {item.descricao}
                        </td>
                        <td className="p-3 text-texto-medio dark:text-texto-medio-dark">
                          {formatarDataBR(item.dataVencimento)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-perigo-suave text-perigo dark:bg-superficie-dark/60 dark:text-texto-forte-dark">
                            {item.diasAtraso} dias
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-perigo dark:text-texto-forte-dark tabular-nums">
                          {formatarMoeda(item.valorDevido)}
                        </td>
                        <td className="p-3 text-texto-medio dark:text-texto-medio-dark">
                          <div>{item.emailFinanceiro}</div>
                          <div className="text-[10px] text-texto-medio">{item.telefone}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. RELATÓRIO DE RENTABILIDADE POR CLIENTE */}
      {tipoRelatorio === 'rentabilidade' && (
        <div className="space-y-4">
          <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
            <div className="p-4 border-b border-borda dark:border-borda-dark">
              <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
                Margem de Contribuição por Conta de Cliente
              </h3>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                Avaliação de faturamento versus custos alocados (equipe PJ, mídia e ferramentas dedicadas).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-fundo-sutil dark:bg-superficie-dark/60 border-b border-borda dark:border-borda-dark text-texto-medio font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3 text-right">Receita Total</th>
                    <th className="p-3 text-right">Custos Diretos (CSP)</th>
                    <th className="p-3 text-right">Margem de Contribuição</th>
                    <th className="p-3 text-right">% Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rentabilidadeClientes.map((c) => (
                    <tr key={c.clienteId} className="hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/40">
                      <td className="p-3 font-semibold text-texto-medio dark:text-texto-medio-dark">
                        {c.clienteNome}
                      </td>
                      <td className="p-3 text-right font-semibold text-sucesso dark:text-texto-forte-dark tabular-nums">
                        {formatarMoeda(c.receitaTotal)}
                      </td>
                      <td className="p-3 text-right text-perigo dark:text-texto-forte-dark tabular-nums">
                        {formatarMoeda(c.custoAlocado)}
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        <span
                          className={
                            c.margemContribuicao >= 0
                              ? 'text-primaria dark:text-primaria-clara'
                              : 'text-perigo dark:text-texto-forte-dark'
                          }
                        >
                          {formatarMoeda(c.margemContribuicao)}
                        </span>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.margemPercentual >= 40
                              ? 'bg-sucesso-suave text-sucesso dark:bg-superficie-dark/50 dark:text-texto-forte-dark'
                              : c.margemPercentual >= 20
                              ? 'bg-alerta-suave text-alerta dark:bg-superficie-dark/50 dark:text-texto-forte-dark'
                              : 'bg-perigo-suave text-perigo dark:bg-superficie-dark/50 dark:text-texto-forte-dark'
                          }`}
                        >
                          {c.margemPercentual.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
