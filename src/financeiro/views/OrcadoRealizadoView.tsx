import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Target,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  X,
  Plus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  formatarMoeda,
  formatarPorcentagem,
  formatarMesCompetencia,
} from '../utils/formatters';
import { calcularMatrizDRE, ItemLinhaDRE } from '../utils/calculations';
import { Lancamento } from '../types';

export const OrcadoRealizadoView: React.FC = () => {
  const {
    lancamentos,
    categorias,
    metasOrcamentarias,
    salvarMeta,
    abrirModalNovoLancamento,
    anoSelecionado,
    mesesDoPeriodoAtual,
    isLancamentoNoPeriodo,
    showToast,
  } = useApp();

  // Estado para Drill-down: modal exibindo lançamentos daquela linha/categoria
  const [drillDownLinha, setDrillDownLinha] = useState<{
    titulo: string;
    lancamentos: Lancamento[];
  } | null>(null);

  // Estado para Modal de Edição de Metas Orçamentárias
  const [modalMetasAberto, setModalMetasAberto] = useState(false);
  const [categoriaMetaSelecionada, setCategoriaMetaSelecionada] = useState<string>(
    categorias[0]?.id || ''
  );
  const [valorMetaMensalCents, setValorMetaMensalCents] = useState<number>(0);
  const [percentualReajuste, setPercentualReajuste] = useState<number>(0);

  // Lançamentos filtrados pelo período atual
  const lancamentosPeriodo = useMemo(() => {
    return lancamentos.filter((l) => isLancamentoNoPeriodo(l));
  }, [lancamentos, isLancamentoNoPeriodo]);

  // Cálculo da Estrutura DRE Completa
  const linhasDRE = useMemo(() => {
    return calcularMatrizDRE(lancamentosPeriodo, categorias, metasOrcamentarias);
  }, [lancamentosPeriodo, categorias, metasOrcamentarias]);

  // Handler de Drill-down
  const handleAbrirDrillDown = (linha: ItemLinhaDRE) => {
    // Busca lançamentos que compõem essa categoria ou grupo
    let correspondentes: Lancamento[] = [];
    if (linha.categoriaId) {
      correspondentes = lancamentosPeriodo.filter((l) => l.categoriaId === linha.categoriaId);
    } else if (linha.chave) {
      correspondentes = lancamentosPeriodo.filter((l) => l.grupo === linha.chave);
    }

    setDrillDownLinha({
      titulo: linha.descricao,
      lancamentos: correspondentes,
    });
  };

  // Exportar matriz para Excel (.xlsx)
  const handleExportarExcel = () => {
    const dadosExcel = linhasDRE.map((linha) => ({
      Estrutura: linha.descricao,
      Tipo: linha.tipo === 'totalizador' ? 'Totalizador' : 'Conta',
      'Orçado (R$)': linha.orcado / 100,
      'Realizado (R$)': linha.realizado / 100,
      'Variação (R$)': linha.variacaoValor / 100,
      'Variação (%)': Number(linha.variacaoPercentual.toFixed(2)),
      Status: linha.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orçado x Realizado');
    XLSX.writeFile(wb, `orcado_x_realizado_${anoSelecionado}.xlsx`);
    showToast('Planilha Excel (.xlsx) exportada com sucesso!');
  };

  // Exportar matriz para PDF
  const handleExportarPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(14);
    doc.text(`Demonstrativo DRE - Orçado x Realizado (${anoSelecionado})`, 40, 40);

    const head = [['Estrutura DRE', 'Orçado', 'Realizado', 'Variação R$', 'Variação %', 'Status']];
    const data = linhasDRE.map((l) => [
      l.descricao,
      formatarMoeda(l.orcado),
      formatarMoeda(l.realizado),
      formatarMoeda(l.variacaoValor),
      formatarPorcentagem(l.variacaoPercentual),
      l.status.toUpperCase(),
    ]);

    autoTable(doc, {
      head,
      body: data,
      startY: 60,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`dre_orcado_x_realizado_${anoSelecionado}.pdf`);
    showToast('Relatório em PDF exportado com sucesso!');
  };

  // Salvar Metas para todos os meses do ano com reajuste opcional
  const handleAplicarMetasAno = () => {
    if (!categoriaMetaSelecionada) return;

    let valorAtual = valorMetaMensalCents;
    for (let mes = 1; mes <= 12; mes++) {
      const mesFormatado = `${anoSelecionado}-${String(mes).padStart(2, '0')}`;
      if (mes > 1 && percentualReajuste > 0) {
        valorAtual = Math.round(valorAtual * (1 + percentualReajuste / 100));
      }
      salvarMeta({
        id: `meta_${categoriaMetaSelecionada}_${mesFormatado}`,
        categoriaId: categoriaMetaSelecionada,
        mesCompetencia: mesFormatado,
        valorOrcado: valorAtual,
      });
    }

    setModalMetasAberto(false);
    showToast('Metas orçamentárias aplicadas para todos os meses do ano!');
  };

  // Status visual badge para DRE
  const renderStatusLinha = (status: ItemLinhaDRE['status']) => {
    if (status === 'dentro') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sucesso-suave dark:bg-superficie-dark/60 text-sucesso dark:text-texto-forte-dark">
          Dentro da meta
        </span>
      );
    }
    if (status === 'alerta') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-alerta-suave dark:bg-superficie-dark/60 text-alerta dark:text-texto-forte-dark">
          Atenção
        </span>
      );
    }
    if (status === 'estourado') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-perigo-suave dark:bg-superficie-dark/60 text-perigo dark:text-texto-forte-dark">
          Estourado
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark">
        Normal
      </span>
    );
  };

  // Se o aplicativo estiver totalmente zerado:
  if (lancamentos.length === 0 && metasOrcamentarias.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Orçado × Realizado (DRE Gerencial)
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Matriz de apuração de resultados com drill-down por centro de custos e metas.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum valor apurado ainda"
          descricao="A matriz de Orçado x Realizado apura margem de contribuição, custos diretos, despesas operacionais fixas e EBITDA com base nos seus lançamentos reais."
          acaoTexto="Criar primeiro lançamento"
          onAcao={() => abrirModalNovoLancamento('despesa')}
          secundariaTexto="Definir Metas Orçamentárias"
          onSecundaria={() => setModalMetasAberto(true)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Orçado × Realizado (DRE Gerencial)
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Acompanhe variações em R$ e % com auditoria por drill-down.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Definir Metas */}
          <button
            type="button"
            onClick={() => setModalMetasAberto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-superficie dark:bg-superficie-dark border border-borda-forte dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil text-texto-medio dark:text-texto-medio-dark text-xs font-semibold rounded-[var(--radius-controle)] shadow-sutil cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-primaria" />
            <span>Definir Metas</span>
          </button>

          {/* Exportar Excel */}
          <button
            type="button"
            onClick={handleExportarExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-superficie dark:bg-superficie-dark border border-borda-forte dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil text-texto-medio dark:text-texto-medio-dark text-xs font-semibold rounded-[var(--radius-controle)] shadow-sutil cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sucesso" />
            <span>Exportar Excel</span>
          </button>

          {/* Exportar PDF */}
          <button
            type="button"
            onClick={handleExportarPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold rounded-[var(--radius-controle)] shadow-sutil cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Matriz DRE */}
      <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark uppercase font-semibold text-[10px] tracking-wider">
                <th className="p-3">Estrutura DRE</th>
                <th className="p-3 text-right">Orçado (R$)</th>
                <th className="p-3 text-right">Realizado (R$)</th>
                <th className="p-3 text-right">Variação (R$)</th>
                <th className="p-3 text-right">Variação (%)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {linhasDRE.map((linha, idx) => {
                const isTotal = linha.tipo === 'totalizador';

                return (
                  <tr
                    key={idx}
                    onClick={() => handleAbrirDrillDown(linha)}
                    className={`transition-colors cursor-pointer ${
                      isTotal
                        ? 'bg-fundo-sutil/70 dark:bg-superficie-dark/60 font-bold text-texto-medio dark:text-texto-medio-dark'
                        : 'hover:bg-fundo-sutil/80 dark:hover:bg-fundo-sutil/40 text-texto-medio dark:text-texto-medio-dark'
                    }`}
                  >
                    {/* Descrição com indentação e ícone de drill-down */}
                    <td className="p-3">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${linha.nivel * 16}px` }}
                      >
                        {!isTotal && <ChevronRight className="w-3 h-3 text-texto-medio shrink-0" />}
                        <span>{linha.descricao}</span>
                      </div>
                    </td>

                    {/* Orçado */}
                    <td className="p-3 text-right tabular-nums">
                      {formatarMoeda(linha.orcado)}
                    </td>

                    {/* Realizado */}
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {formatarMoeda(linha.realizado)}
                    </td>

                    {/* Variação em R$ */}
                    <td
                      className={`p-3 text-right tabular-nums font-semibold ${
                        linha.variacaoValor >= 0
                          ? 'text-sucesso dark:text-texto-forte-dark'
                          : 'text-perigo dark:text-texto-forte-dark'
                      }`}
                    >
                      {formatarMoeda(linha.variacaoValor)}
                    </td>

                    {/* Variação em % */}
                    <td className="p-3 text-right tabular-nums">
                      {formatarPorcentagem(linha.variacaoPercentual)}
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      {renderStatusLinha(linha.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DRILL-DOWN: DETALHAMENTO DA LINHA */}
      {drillDownLinha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
              <div>
                <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                  Drill-down: {drillDownLinha.titulo}
                </h3>
                <p className="text-xs text-texto-medio">
                  {drillDownLinha.lancamentos.length} lançamento(s) compõem esta linha.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrillDownLinha(null)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {drillDownLinha.lancamentos.length === 0 ? (
                <div className="py-8 text-center text-xs text-texto-medio">
                  Nenhum lançamento individual encontrado para esta linha no período selecionado.
                </div>
              ) : (
                drillDownLinha.lancamentos.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda/60 dark:border-borda-dark/60 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block">
                        {l.descricao}
                      </span>
                      <span className="text-texto-medio text-[10px]">
                        Competência: {formatarMesCompetencia(l.mesCompetencia)} • Venc:{' '}
                        {l.dataVencimento}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold tabular-nums block text-texto-medio dark:text-texto-medio-dark">
                        {formatarMoeda(l.valorRealizado !== undefined ? l.valorRealizado : l.valorOrcado)}
                      </span>
                      <span className="text-[10px] text-texto-medio uppercase">{l.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-borda dark:border-borda-dark">
              <button
                type="button"
                onClick={() => setDrillDownLinha(null)}
                className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark hover:bg-fundo-sutil text-xs font-semibold rounded-[var(--radius-controle)] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEFINIR METAS ORÇAMENTÁRIAS */}
      {modalMetasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
              <div>
                <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                  Definir Metas Orçamentárias
                </h3>
                <p className="text-xs text-texto-medio">Ano de Referência: {anoSelecionado}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalMetasAberto(false)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Categoria
                </label>
                <select
                  value={categoriaMetaSelecionada}
                  onChange={(e) => setCategoriaMetaSelecionada(e.target.value)}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.tipo.toUpperCase()}] {c.grupo} &gt; {c.subcategoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Valor Orçado Mensal Base (Janeiro/{anoSelecionado})
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  onChange={(e) => setValorMetaMensalCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Reajuste mensal acumulado (% opcional)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={percentualReajuste}
                  onChange={(e) => setPercentualReajuste(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borda dark:border-borda-dark">
              <button
                type="button"
                onClick={() => setModalMetasAberto(false)}
                className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark hover:bg-fundo-sutil text-xs font-semibold rounded-[var(--radius-controle)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAplicarMetasAno}
                className="px-4 py-2 bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold rounded-[var(--radius-controle)] cursor-pointer"
              >
                Aplicar para o ano todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
