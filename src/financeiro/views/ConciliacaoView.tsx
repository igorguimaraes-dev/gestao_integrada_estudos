import React, { useState, useMemo, useEffect } from 'react';
import {
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  formatarMoeda,
  formatarDataBR,
  getDataHojeISO,
} from '../utils/formatters';
import { calcularSaldoConta } from '../utils/calculations';
import { ExtratoTransacao, Lancamento } from '../types';

type LinhaExtrato = ExtratoTransacao;
/*
  id: string;
  data: string;
  descricao: string;
  valorCents: number; // positivo para crédito, negativo para débito
  conciliadoComId?: string;
}*/

export const ConciliacaoView: React.FC = () => {
  const {
    lancamentos,
    contas,
    salvarLancamento,
    salvarLancamentosEmLote,
    extratoTransacoes,
    salvarExtratoTransacoes,
    showToast,
    abrirModalNovoLancamento,
  } = useApp();

  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>(
    contas[0]?.id || ''
  );

  // Linhas do extrato carregadas do arquivo OFX ou CSV
  const [extratoLinhas, setExtratoLinhas] = useState<LinhaExtrato[]>([]);
  const [saldoExtratoInformadoCents, setSaldoExtratoInformadoCents] = useState<number | null>(null);

  useEffect(() => {
    setExtratoLinhas(extratoTransacoes.filter((linha) => linha.contaBancariaId === contaSelecionadaId));
  }, [contaSelecionadaId, extratoTransacoes]);

  const contaSelecionada = contas.find((c) => c.id === contaSelecionadaId);

  // Saldo no sistema da conta selecionada
  const saldoSistema = useMemo(() => {
    if (!contaSelecionada) return 0;
    return calcularSaldoConta(contaSelecionada, lancamentos).saldoAtual;
  }, [contaSelecionada, lancamentos]);

  // Diferença com o extrato
  const diferencaExtrato = saldoExtratoInformadoCents !== null
    ? saldoSistema - saldoExtratoInformadoCents
    : 0;

  // Parser de arquivo OFX ou CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      if (!conteudo) return;

      const linhasParsed: LinhaExtrato[] = [];

      // Detecção de formato: OFX ou CSV
      if (file.name.toLowerCase().endsWith('.ofx') || conteudo.includes('<OFX>')) {
        // Parser simplificado e resiliente de OFX
        const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
        let match;
        let idx = 1;

        while ((match = stmtTrnRegex.exec(conteudo)) !== null) {
          const bloco = match[1];
          const dtMatch = /<DTPOSTED>(\d{8})/i.exec(bloco);
          const trnAmtMatch = /<TRNAMT>([-\d.]+)/i.exec(bloco);
          const memoMatch = /<MEMO>(.*?)[\r\n<]/i.exec(bloco);

          if (dtMatch && trnAmtMatch) {
            const rawDt = dtMatch[1];
            const dataIso = `${rawDt.slice(0, 4)}-${rawDt.slice(4, 6)}-${rawDt.slice(6, 8)}`;
            const valorFloat = parseFloat(trnAmtMatch[1]);
            const valorCents = Math.round(valorFloat * 100);
            const desc = memoMatch ? memoMatch[1].trim() : 'Transação OFX';

            const identificador = `${dataIso}_${valorCents}_${desc.toLowerCase().replace(/\s+/g, '_')}_${idx++}`;
            linhasParsed.push({
              id: `ofx_${contaSelecionadaId}_${identificador}`,
              contaBancariaId: contaSelecionadaId,
              data: dataIso,
              descricao: desc,
              valorCents,
              conciliado: false,
            });
          }
        }
      } else {
        // Parser de CSV com detecção de separador
        const separador = conteudo.includes(';') ? ';' : ',';
        const linhasRaw = conteudo.split(/\r?\n/).filter(Boolean);

        linhasRaw.slice(1).forEach((linha, i) => {
          const colunas = linha.split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (colunas.length >= 3) {
            // Espera data, descrição, valor
            const dataStr = colunas[0];
            let dataIso = getDataHojeISO();
            if (dataStr.includes('/')) {
              const [d, m, y] = dataStr.split('/');
              dataIso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (dataStr.includes('-')) {
              dataIso = dataStr;
            }

            const valorFloat = parseFloat(colunas[2].replace(/\./g, '').replace(',', '.'));
            const valorCents = Math.round(valorFloat * 100);

            const identificador = `${dataIso}_${valorCents}_${colunas[1].toLowerCase().replace(/\s+/g, '_')}_${i}`;
            linhasParsed.push({
              id: `csv_${contaSelecionadaId}_${identificador}`,
              contaBancariaId: contaSelecionadaId,
              data: dataIso,
              descricao: colunas[1],
              valorCents,
              conciliado: false,
            });
          }
        });
      }

      const novasLinhas = linhasParsed.filter(
        (linha) => !extratoTransacoes.some((existente) => existente.id === linha.id)
      );
      salvarExtratoTransacoes([...extratoTransacoes, ...novasLinhas]);
      showToast(`${linhasParsed.length} transações importadas do extrato com sucesso!`);
    };

    reader.readAsText(file);
  };

  // Algoritmo de Sugestão Inteligente de Correspondência (valor idêntico, data aproximada ± 3 dias, texto)
  const obterMelhorCorrespondente = (linha: LinhaExtrato) => {
    if (linha.lancamentoIdVinculado) {
      return {
        lancamento: lancamentos.find((l) => l.id === linha.lancamentoIdVinculado),
        confianca: 100,
        jaConciliado: true,
      };
    }

    const valorAbsoluto = Math.abs(linha.valorCents);
    const tipoEsperado = linha.valorCents >= 0 ? 'receita' : 'despesa';

    // Candidatos que ainda não estão conciliados
    const candidatos = lancamentos.filter((l) => {
      if (l.conciliado || l.status === 'cancelado') return false;
      if (l.tipo !== tipoEsperado && l.tipo !== 'transferencia') return false;
      if (l.contaBancariaId !== contaSelecionadaId && l.contaDestinoId !== contaSelecionadaId) return false;
      return true;
    });

    let melhorCandidato: Lancamento | undefined;
    let maiorPontuacao = 0;

    const dataExtrato = new Date(linha.data).getTime();

    candidatos.forEach((c) => {
      let pontos = 0;
      const valCandidato = c.valorRealizado !== undefined ? c.valorRealizado : c.valorOrcado;

      // 1. Valor exato (peso 60%)
      if (valCandidato === valorAbsoluto) {
        pontos += 60;
      } else if (Math.abs(valCandidato - valorAbsoluto) < 200) {
        pontos += 30; // Diferença de até 2 reais
      }

      // 2. Data próxima ± 3 dias (peso 30%)
      const dataCandidato = new Date(c.dataPagamento || c.dataVencimento).getTime();
      const diffDias = Math.abs(dataExtrato - dataCandidato) / (1000 * 60 * 60 * 24);
      if (diffDias === 0) pontos += 30;
      else if (diffDias <= 1) pontos += 25;
      else if (diffDias <= 3) pontos += 15;

      // 3. Similaridade textual na descrição (peso 10%)
      const descLinha = linha.descricao.toLowerCase();
      const descCandidato = c.descricao.toLowerCase();
      if (descLinha.includes(descCandidato) || descCandidato.includes(descLinha)) {
        pontos += 10;
      }

      if (pontos > maiorPontuacao) {
        maiorPontuacao = pontos;
        melhorCandidato = c;
      }
    });

    return {
      lancamento: melhorCandidato,
      confianca: maiorPontuacao,
      jaConciliado: false,
    };
  };

  // Conciliar Linha do Extrato com Lançamento
  const handleConciliar = (linhaId: string, lancamentoId: string) => {
    const lanc = lancamentos.find((l) => l.id === lancamentoId);
    if (!lanc) return;

    salvarLancamento({
      ...lanc,
      conciliado: true,
      dataPagamento: lanc.dataPagamento || getDataHojeISO(),
      valorRealizado: lanc.valorRealizado !== undefined ? lanc.valorRealizado : lanc.valorOrcado,
      status: 'realizado',
    });

    salvarExtratoTransacoes(
      extratoTransacoes.map((item) =>
        item.id === linhaId
          ? { ...item, conciliado: true, lancamentoIdVinculado: lancamentoId }
          : item
      )
    );

    showToast('Lançamento conciliado com sucesso!');
  };

  // Desfazer Conciliação
  const handleDesfazerConciliacao = (linhaId: string, lancamentoId: string) => {
    const lanc = lancamentos.find((l) => l.id === lancamentoId);
    if (lanc) {
      salvarLancamento({
        ...lanc,
        conciliado: false,
      });
    }

    salvarExtratoTransacoes(
      extratoTransacoes.map((item) =>
        item.id === linhaId
          ? { ...item, conciliado: false, lancamentoIdVinculado: undefined }
          : item
      )
    );

    showToast('Conciliação desfeita.');
  };

  // Criar Lançamento a partir da Linha do Extrato
  const handleCriarLancamentoDaLinha = (linha: LinhaExtrato) => {
    const tipo = linha.valorCents >= 0 ? 'receita' : 'despesa';
    const valor = Math.abs(linha.valorCents);

    abrirModalNovoLancamento(tipo, {
      descricao: linha.descricao,
      valorOrcado: valor,
      dataVencimento: linha.data,
      contaBancariaId: contaSelecionadaId,
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Conciliação Bancária
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Compare extratos bancários reais (OFX ou CSV) com os lançamentos do sistema.
          </p>
        </div>

        {/* Seletor de Conta Bancária */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-texto-medio">Conta:</label>
          <select
            value={contaSelecionadaId}
            onChange={(e) => setContaSelecionadaId(e.target.value)}
            className="text-xs rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-1.5 font-semibold text-texto-medio dark:text-texto-medio-dark"
          >
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.banco})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faixa de Comparação de Saldos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            Saldo no Sistema ({contaSelecionada?.nome || 'Conta'})
          </span>
          <span className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
            {formatarMoeda(saldoSistema)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            Saldo no Extrato Bancário
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="number"
              placeholder="Digitar saldo real..."
              value={saldoExtratoInformadoCents !== null ? saldoExtratoInformadoCents / 100 : ''}
              onChange={(e) =>
                setSaldoExtratoInformadoCents(
                  e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null
                )
              }
              className="text-sm px-2.5 py-1 rounded border border-borda-forte dark:border-borda-dark bg-fundo-sutil dark:bg-superficie-dark w-36 font-semibold"
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            Diferença a Conciliar
          </span>
          <span
            className={`text-xl font-bold tabular-nums ${
              diferencaExtrato === 0
                ? 'text-sucesso dark:text-texto-forte-dark'
                : 'text-alerta dark:text-texto-forte-dark'
            }`}
          >
            {saldoExtratoInformadoCents !== null ? formatarMoeda(diferencaExtrato) : 'Informe o saldo'}
          </span>
        </div>
      </div>

      {/* Upload de Extrato */}
      {extratoLinhas.length === 0 ? (
        <div className="p-8 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border-2 border-dashed border-borda-forte dark:border-borda-dark text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primaria-suave dark:bg-navy-claro/60 text-primaria dark:text-primaria-clara flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Importe o Extrato da Conta ({contaSelecionada?.nome})
          </h3>
          <p className="text-xs text-texto-medio max-w-md mx-auto">
            Carregue um arquivo no formato <strong>OFX</strong> (padrão de exportação dos bancos e internet banking) ou <strong>CSV</strong> para conciliar as transações lado a lado.
          </p>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-card">
              <UploadCloud className="w-4 h-4" />
              <span>Selecionar Arquivo OFX / CSV</span>
              <input
                type="file"
                accept=".ofx,.csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        /* Painel Lado a Lado de Conciliação */
        <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
          <div className="p-4 bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primaria" />
              <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark">
                {extratoLinhas.length} transações no extrato importado
              </span>
            </div>
            <label className="text-xs text-primaria hover:underline cursor-pointer font-semibold">
              Importar outro extrato
              <input
                type="file"
                accept=".ofx,.csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {extratoLinhas.map((linha) => {
              const { lancamento, confianca, jaConciliado } = obterMelhorCorrespondente(linha);

              return (
                <div
                  key={linha.id}
                  className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center hover:bg-fundo-sutil/50 dark:hover:bg-fundo-sutil/30 transition-colors"
                >
                  {/* Lado Esquerdo: Linha do Extrato */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark truncate pr-2">
                        {linha.descricao}
                      </span>
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          linha.valorCents >= 0
                            ? 'text-sucesso dark:text-texto-forte-dark'
                            : 'text-perigo dark:text-texto-forte-dark'
                        }`}
                      >
                        {formatarMoeda(Math.abs(linha.valorCents))}
                      </span>
                    </div>
                    <span className="text-[10px] text-texto-medio block">
                      Data no Extrato: {formatarDataBR(linha.data)}
                    </span>
                  </div>

                  {/* Lado Direito: Correspondente do Sistema ou Ação */}
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda/60 dark:border-borda-dark/60">
                    {lancamento ? (
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark truncate">
                            {lancamento.descricao}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              confianca >= 80
                                ? 'bg-sucesso-suave dark:bg-superficie-dark text-sucesso dark:text-texto-forte-dark'
                                : 'bg-alerta-suave dark:bg-superficie-dark text-alerta dark:text-texto-forte-dark'
                            }`}
                          >
                            {confianca}% match
                          </span>
                        </div>
                        <span className="text-[10px] text-texto-medio block">
                          Sistema: {formatarDataBR(lancamento.dataVencimento)} •{' '}
                          {formatarMoeda(lancamento.valorOrcado)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-texto-medio italic">
                        Nenhum lançamento correspondente encontrado
                      </span>
                    )}

                    <div className="shrink-0 flex items-center gap-2">
                      {jaConciliado ? (
                        <button
                          type="button"
                          onClick={() => handleDesfazerConciliacao(linha.id, lancamento!.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-texto-medio hover:text-texto-medio border rounded cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Desfazer</span>
                        </button>
                      ) : lancamento ? (
                        <button
                          type="button"
                          onClick={() => handleConciliar(linha.id, lancamento.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conciliar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCriarLancamentoDaLinha(linha)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-primaria hover:bg-primaria-hover text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Criar Lançamento</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
