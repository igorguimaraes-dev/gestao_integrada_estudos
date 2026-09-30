import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Save, Search, ShieldCheck, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatarMesCompetencia, formatarMoeda } from '../utils/formatters';
import { calcularSaldoConta, obterValorEfetivoLancamento } from '../utils/calculations';
import type { CenarioSimulacao, ItemHipoteticoSimulador } from '../types';

type TipoEvento = ItemHipoteticoSimulador['tipo'];
type TipoLinha = 'receita_planejada' | 'despesa_planejada';

const criarId = () => crypto.randomUUID?.() || `cenario-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const criarCenario = (): CenarioSimulacao => ({
  id: '',
  nome: 'Planejamento anual',
  horizonte: 12,
  premissas: { crescimentoReceitaMensalPct: 0, reajusteDespesasPct: 0, inadimplenciaPct: 0, impostoEstimadoPct: 0, churnPct: 0 },
  itensHipoteticos: [],
  ajustesMensaisCents: {},
  createdAt: new Date().toISOString(),
});

const adicionarMeses = (mes: string, quantidade: number) => {
  const [ano, numeroMes] = mes.split('-').map(Number);
  const data = new Date(ano, numeroMes - 1 + quantidade, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
};

const eReceita = (tipo: TipoEvento) => ['novo_cliente', 'remover_cliente', 'receita_planejada'].includes(tipo);
const eReducaoReceita = (tipo: TipoEvento) => tipo === 'remover_cliente';

const categoriaDeDespesa = (descricao: string) => {
  const texto = descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/cartao|fatura do cartao/.test(texto)) return 'Cartão de crédito';
  if (/inss|das|darf|fazenda|imposto|tribut|receita federal/.test(texto)) return 'Impostos e encargos';
  if (/taxa|boleto|pix|mensageria|notificacao|emissao da nota/.test(texto)) return 'Taxas bancárias';
  if (/caio|helton|igor|marlon|mylena|nathalia|ralph|giuliana|prestador|freelancer/.test(texto)) return 'Pagamentos PJ';
  return 'Despesas operacionais';
};

export const SimuladorView: React.FC = () => {
  const { contas, clientes, lancamentos, extratoTransacoes, cenarios, mesSelecionado, salvarCenario, excluirCenario, showToast } = useApp();
  const [cenarioAtivoId, setCenarioAtivoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<CenarioSimulacao>(() => criarCenario());
  const [anoGrade, setAnoGrade] = useState(() => Number(mesSelecionado.slice(0, 4)));
  const [detalheAberto, setDetalheAberto] = useState<'receita' | 'despesa' | null>(null);
  const [buscaDetalhe, setBuscaDetalhe] = useState('');
  const [categoriasFechadas, setCategoriasFechadas] = useState<Record<string, boolean>>({});

  const mesesDaGrade = useMemo(() => Array.from({ length: 12 }, (_, indice) => `${anoGrade}-${String(indice + 1).padStart(2, '0')}`), [anoGrade]);
  const anosDisponiveis = useMemo(() => Array.from({ length: 9 }, (_, indice) => anoGrade - 4 + indice), [anoGrade]);

  const saldoInicial = useMemo(() => contas.filter((conta) => conta.ativa)
    .reduce((total, conta) => total + calcularSaldoConta(conta, lancamentos).saldoAtual, 0), [contas, lancamentos]);

  const valoresReais = useMemo(() => {
    const mapa: Record<string, { receitas: number; despesas: number }> = {};
    mesesDaGrade.forEach((mes) => { mapa[mes] = { receitas: 0, despesas: 0 }; });
    lancamentos.forEach((lancamento) => {
      if (!mapa[lancamento.mesCompetencia] || lancamento.status === 'cancelado' || lancamento.tipo === 'transferencia') return;
      const valor = obterValorEfetivoLancamento(lancamento);
      if (lancamento.tipo === 'receita') mapa[lancamento.mesCompetencia].receitas += valor;
      if (lancamento.tipo === 'despesa') mapa[lancamento.mesCompetencia].despesas += valor;
    });
    return mapa;
  }, [lancamentos, mesesDaGrade]);

  const linhasBase = useMemo(() => {
    const nomesClientes = new Map(clientes.map((cliente) => [cliente.id, cliente.nomeFantasia || cliente.nomeRazaoSocial]));
    const linhas = new Map<string, { id: string; tipo: 'receita' | 'despesa'; descricao: string; valores: Record<string, number> }>();
    lancamentos.forEach((lancamento) => {
      if (!mesesDaGrade.includes(lancamento.mesCompetencia) || lancamento.status === 'cancelado' || lancamento.tipo === 'transferencia') return;
      if (lancamento.tipo !== 'receita' && lancamento.tipo !== 'despesa') return;
      const descricao = lancamento.tipo === 'receita'
        ? nomesClientes.get(lancamento.clienteId || '') || lancamento.descricao
        : lancamento.descricao;
      const id = `${lancamento.tipo}:${descricao}`;
      const linha = linhas.get(id) || { id, tipo: lancamento.tipo, descricao, valores: {} };
      linha.valores[lancamento.mesCompetencia] = (linha.valores[lancamento.mesCompetencia] || 0) + obterValorEfetivoLancamento(lancamento);
      linhas.set(id, linha);
    });
    return Array.from(linhas.values()).sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));
  }, [clientes, lancamentos, mesesDaGrade]);

  const linhasDetalheAgrupadas = useMemo(() => {
    if (!detalheAberto) return [] as Array<[string, typeof linhasBase]>;
    const termo = buscaDetalhe.trim().toLocaleLowerCase('pt-BR');
    const grupos = new Map<string, typeof linhasBase>();
    linhasBase
      .filter((linha) => linha.tipo === detalheAberto && (!termo || linha.descricao.toLocaleLowerCase('pt-BR').includes(termo)))
      .forEach((linha) => {
        const categoria = detalheAberto === 'receita' ? 'Receitas / clientes Asaas' : categoriaDeDespesa(linha.descricao);
        grupos.set(categoria, [...(grupos.get(categoria) || []), linha]);
      });
    const ordem = ['Receitas / clientes Asaas', 'Pagamentos PJ', 'Impostos e encargos', 'Taxas bancárias', 'Cartão de crédito', 'Despesas operacionais'];
    return Array.from(grupos.entries()).sort(([a], [b]) => ordem.indexOf(a) - ordem.indexOf(b));
  }, [buscaDetalhe, detalheAberto, linhasBase]);

  const mesPodeSerEditado = (mes: string) => mes >= mesSelecionado;
  const valorLinhaNoCenario = (linha: { id: string; valores: Record<string, number> }, mes: string) => {
    const ajuste = rascunho.ajustesMensaisCents?.[`${linha.id}|${mes}`];
    return mesPodeSerEditado(mes) && ajuste !== undefined ? ajuste : (linha.valores[mes] || 0);
  };

  const valoresBaseNoCenario = useMemo(() => mesesDaGrade.reduce<Record<string, { receitas: number; despesas: number }>>((mapa, mes) => {
    mapa[mes] = linhasBase.reduce((total, linha) => {
      const valor = valorLinhaNoCenario(linha, mes);
      if (linha.tipo === 'receita') total.receitas += valor;
      else total.despesas += valor;
      return total;
    }, { receitas: 0, despesas: 0 });
    return mapa;
  }, {}), [linhasBase, mesesDaGrade, rascunho.ajustesMensaisCents, mesSelecionado]);

  // A grade resumida mostra a base já ajustada pelo cenário; os lançamentos
  // reais continuam preservados em valoresReais para comparação e histórico.
  const valoresBase = valoresBaseNoCenario;

  const baseSelecionada = useMemo(() => valoresReais[mesSelecionado] || { receitas: 0, despesas: 0 }, [mesSelecionado, valoresReais]);

  const valorEventoNoMes = (item: ItemHipoteticoSimulador, mes: string) => {
    if (item.valoresMensaisCents && Object.prototype.hasOwnProperty.call(item.valoresMensaisCents, mes)) {
      return item.valoresMensaisCents[mes] || 0;
    }
    const [anoInicial, mesInicial] = mesSelecionado.split('-').map(Number);
    const [anoAtual, mesAtual] = mes.split('-').map(Number);
    const distancia = (anoAtual - anoInicial) * 12 + mesAtual - mesInicial;
    const inicio = Math.max(item.mesInicioRelativo - 1, 0);
    if (distancia < inicio || (item.duracaoMeses !== undefined && distancia >= inicio + item.duracaoMeses)) return 0;
    if (item.tipo === 'investimento_pontual' && distancia !== inicio) return 0;
    return item.valorMensalCents;
  };

  const totalItensNoMes = (mes: string, tipo: TipoLinha) => rascunho.itensHipoteticos
    .filter((item) => tipo === 'receita_planejada' ? eReceita(item.tipo) : !eReceita(item.tipo))
    .reduce((total, item) => {
      const valor = valorEventoNoMes(item, mes);
      return total + (eReducaoReceita(item.tipo) ? -valor : valor);
    }, 0);

  const dadosProjecao = useMemo(() => {
    let saldoBase = saldoInicial;
    let saldoCenario = saldoInicial;
    return Array.from({ length: rascunho.horizonte }, (_, indice) => {
      const mes = adicionarMeses(mesSelecionado, indice);
      const baseDoMes = valoresReais[mes] || baseSelecionada;
      const baseDoMesCenario = valoresBaseNoCenario[mes] || baseSelecionada;
      const receitasBase = baseDoMes.receitas;
      const despesasBase = baseDoMes.despesas;
      let receitasCenario = Math.round(baseDoMesCenario.receitas * (1 + rascunho.premissas.crescimentoReceitaMensalPct / 100));
      receitasCenario = Math.round(receitasCenario * (1 - rascunho.premissas.inadimplenciaPct / 100));
      let despesasCenario = Math.round(baseDoMesCenario.despesas * (1 + rascunho.premissas.reajusteDespesasPct / 100));
      rascunho.itensHipoteticos.forEach((item) => {
        const valor = valorEventoNoMes(item, mes);
        if (eReceita(item.tipo)) receitasCenario += eReducaoReceita(item.tipo) ? -valor : valor;
        else despesasCenario += valor;
      });
      despesasCenario += Math.round(receitasCenario * (rascunho.premissas.impostoEstimadoPct / 100));
      const resultadoBase = receitasBase - despesasBase;
      const resultadoCenario = receitasCenario - despesasCenario;
      saldoBase += resultadoBase;
      saldoCenario += resultadoCenario;
      return { mes, mesLabel: formatarMesCompetencia(mes), resultadoBase, resultadoCenario, saldoBase, saldoCenario, impacto: resultadoCenario - resultadoBase };
    });
  }, [baseSelecionada, rascunho, saldoInicial, valoresReais, valoresBaseNoCenario]);

  const resumo = useMemo(() => {
    const ultimo = dadosProjecao.at(-1);
    const caixaNegativo = dadosProjecao.find((item) => item.saldoCenario < 0);
    return { saldoBase: ultimo?.saldoBase || saldoInicial, saldoCenario: ultimo?.saldoCenario || saldoInicial, caixaNegativo: caixaNegativo?.mes };
  }, [dadosProjecao, saldoInicial]);

  const selecionarCenario = (cenario: CenarioSimulacao) => {
    setCenarioAtivoId(cenario.id);
    setRascunho({ ...cenario, premissas: { ...cenario.premissas }, ajustesMensaisCents: { ...cenario.ajustesMensaisCents }, itensHipoteticos: cenario.itensHipoteticos.map((item) => ({ ...item, valoresMensaisCents: { ...item.valoresMensaisCents } })) });
  };

  const salvarRascunho = () => {
    const cenario = { ...rascunho, id: cenarioAtivoId || criarId() };
    salvarCenario(cenario);
    setCenarioAtivoId(cenario.id);
    setRascunho(cenario);
  };

  const adicionarLinha = (tipo: TipoLinha) => {
    const valoresMensaisCents = Object.fromEntries(mesesDaGrade.map((mes) => [mes, 0]));
    const item: ItemHipoteticoSimulador = {
      id: criarId(), tipo, descricao: tipo === 'receita_planejada' ? 'Nova receita planejada' : 'Nova despesa planejada',
      valorMensalCents: 0, mesInicioRelativo: 1, valoresMensaisCents,
    };
    setRascunho((atual) => ({ ...atual, itensHipoteticos: [...atual.itensHipoteticos, item] }));
  };

  const atualizarLinha = (id: string, atualizacao: Partial<ItemHipoteticoSimulador>) => setRascunho((atual) => ({
    ...atual,
    itensHipoteticos: atual.itensHipoteticos.map((item) => item.id === id ? { ...item, ...atualizacao } : item),
  }));

  const atualizarValor = (item: ItemHipoteticoSimulador, mes: string, valor: string) => {
    const valorCents = Math.max(0, Math.round(Number(valor.replace(',', '.')) * 100) || 0);
    atualizarLinha(item.id, { valoresMensaisCents: { ...item.valoresMensaisCents, [mes]: valorCents } });
  };

  const atualizarBaseNoCenario = (linhaId: string, mes: string, valor: string) => {
    const valorCents = Math.max(0, Math.round(Number(valor.replace(',', '.')) * 100) || 0);
    setRascunho((atual) => ({
      ...atual,
      ajustesMensaisCents: { ...atual.ajustesMensaisCents, [`${linhaId}|${mes}`]: valorCents },
    }));
  };

  const receitasPlanejadas = rascunho.itensHipoteticos.filter((item) => eReceita(item.tipo));
  const despesasPlanejadas = rascunho.itensHipoteticos.filter((item) => !eReceita(item.tipo));

  const saldoFluxoMensal = useMemo(() => {
    const contaAsaas = contas.find((conta) => conta.id === 'asaas-saldo-producao');
    const saldoAtualAsaas = contaAsaas?.saldoInicial ?? saldoInicial;
    const dataReferencia = contaAsaas?.dataSaldoInicial || new Date().toISOString().slice(0, 10);
    const anoReferencia = Number(dataReferencia.slice(0, 4));
    const mesReferencia = dataReferencia.slice(0, 7);
    const movimentosPorMes = extratoTransacoes
      .filter((movimento) => movimento.id.startsWith('asaas-extrato-') && movimento.data.slice(0, 4) === String(anoGrade))
      .reduce<Record<string, number>>((mapa, movimento) => {
        const mes = movimento.data.slice(0, 7);
        mapa[mes] = (mapa[mes] || 0) + movimento.valorCents;
        return mapa;
      }, {});
    const saldoAbertura = anoGrade === anoReferencia
      ? saldoAtualAsaas - Object.entries(movimentosPorMes)
        .filter(([mes]) => mes <= mesReferencia)
        .reduce((total, [, valor]) => total + valor, 0)
      : saldoAtualAsaas;
    let saldo = saldoAbertura;
    return mesesDaGrade.reduce<Record<string, number>>((mapa, mes) => {
      const mesJaRealizado = anoGrade === anoReferencia && mes <= mesReferencia;
      const fluxo = mesJaRealizado
        ? (movimentosPorMes[mes] || 0)
        : valoresBaseNoCenario[mes].receitas + totalItensNoMes(mes, 'receita_planejada') - valoresBaseNoCenario[mes].despesas - totalItensNoMes(mes, 'despesa_planejada');
      saldo += fluxo;
      mapa[mes] = saldo;
      return mapa;
    }, {});
  }, [anoGrade, contas, extratoTransacoes, mesesDaGrade, saldoInicial, valoresBaseNoCenario, rascunho.itensHipoteticos]);

  const linhaEditavel = (item: ItemHipoteticoSimulador, receita: boolean) => (
    <tr key={item.id} className="border-t border-borda dark:border-borda-dark">
      <td className="sticky left-0 z-10 min-w-[210px] bg-superficie p-2 dark:bg-navy">
        <div className="flex items-center gap-1"><input value={item.descricao} onChange={(event) => atualizarLinha(item.id, { descricao: event.target.value })} className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-texto-medio outline-none hover:border-borda focus:border-primaria dark:text-texto-medio-dark" /><button type="button" onClick={() => setRascunho((atual) => ({ ...atual, itensHipoteticos: atual.itensHipoteticos.filter((evento) => evento.id !== item.id) }))} className="rounded p-1 text-texto-medio hover:bg-perigo-suave hover:text-perigo" aria-label="Excluir linha"><Trash2 className="h-3.5 w-3.5" /></button></div>
      </td>
      {mesesDaGrade.map((mes) => (
        <td key={mes} className="min-w-[92px] p-1 text-right">
          {mesPodeSerEditado(mes) ? (
            <input type="number" min="0" value={valorEventoNoMes(item, mes) ? valorEventoNoMes(item, mes) / 100 : ''} onChange={(event) => atualizarValor(item, mes, event.target.value)} placeholder="–" className={`w-full rounded-md border border-transparent bg-fundo-sutil px-2 py-1.5 text-right text-xs tabular-nums outline-none hover:border-borda focus:border-primaria dark:bg-superficie-dark ${receita && !eReducaoReceita(item.tipo) ? 'text-sucesso dark:text-texto-forte-dark' : 'text-perigo dark:text-texto-forte-dark'}`} />
          ) : <span className="px-2 text-xs text-texto-medio dark:text-texto-medio-dark">—</span>}
        </td>
      ))}
    </tr>
  );

  return (
    <div id="planejador-cenarios" className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-primaria bg-gradient-to-r from-primaria via-white to-primaria p-5 dark:border-borda-dark dark:from-primaria-clara/30 dark:via-borda-dark dark:to-primaria-clara/20 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-primaria-suave px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primaria dark:bg-navy-claro dark:text-primaria-clara">Ambiente de simulação</span><ShieldCheck className="h-4 w-4 text-sucesso" /><span className="text-xs text-sucesso dark:text-texto-forte-dark">Nenhuma alteração é feita no Asaas</span></div><h1 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">Planejamento anual de receitas e despesas</h1><p className="mt-1 text-sm text-texto-medio">Insira as premissas diretamente na grade mensal e acompanhe o caixa projetado.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => { setCenarioAtivoId(null); setRascunho(criarCenario()); }} className="rounded-[var(--radius-controle)] border border-primaria bg-superficie px-3 py-2 text-xs font-semibold text-primaria hover:bg-primaria-suave dark:border-borda-dark dark:bg-navy dark:text-primaria-clara">Novo cenário</button><button type="button" onClick={salvarRascunho} className="inline-flex items-center gap-1.5 rounded-[var(--radius-controle)] bg-primaria px-3 py-2 text-xs font-semibold text-white hover:bg-primaria-hover"><Save className="h-4 w-4" /> Salvar</button></div>
      </div>

      <div className="space-y-4">

        <section className="space-y-4">
          <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-borda bg-superficie px-4 py-3 dark:border-borda-dark dark:bg-navy sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-texto-medio">Cenários salvos</h2>
              <p className="mt-0.5 text-xs text-texto-medio">Selecione um cenário sem perder espaço da grade.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Selecionar cenário salvo"
                value={cenarioAtivoId || ''}
                onChange={(event) => {
                  const cenario = cenarios.find((item) => item.id === event.target.value);
                  if (cenario) selecionarCenario(cenario);
                  else { setCenarioAtivoId(null); setRascunho(criarCenario()); }
                }}
                className="min-w-[220px] rounded-[var(--radius-controle)] border border-borda bg-superficie px-3 py-2 text-xs font-medium text-texto-medio outline-none focus:border-primaria dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-medio-dark"
              >
                <option value="">Rascunho novo</option>
                {cenarios.map((cenario) => <option key={cenario.id} value={cenario.id}>{cenario.nome}</option>)}
              </select>
              <button type="button" onClick={salvarRascunho} className="inline-flex items-center gap-1.5 rounded-[var(--radius-controle)] bg-primaria px-3 py-2 text-xs font-semibold text-white hover:bg-primaria-hover">
                <Save className="h-3.5 w-3.5" /> Salvar cenário
              </button>
              <button type="button" disabled={!cenarioAtivoId} onClick={() => cenarioAtivoId && excluirCenario(cenarioAtivoId)} className="rounded-[var(--radius-controle)] p-2 text-texto-medio hover:bg-perigo-suave hover:text-perigo disabled:cursor-not-allowed disabled:opacity-40" aria-label="Excluir cenário selecionado"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="rounded-2xl border border-borda bg-superficie p-4 dark:border-borda-dark dark:bg-navy"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_130px]"><label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Nome do cenário<input value={rascunho.nome} onChange={(event) => setRascunho((atual) => ({ ...atual, nome: event.target.value }))} className="mt-1.5 w-full rounded-[var(--radius-controle)] border border-borda bg-superficie px-3 py-2 text-sm dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-medio-dark" /></label><label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Ano da grade<select value={anoGrade} onChange={(event) => setAnoGrade(Number(event.target.value))} className="mt-1.5 w-full rounded-[var(--radius-controle)] border border-borda bg-superficie px-3 py-2 text-sm dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-medio-dark">{anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano}</option>)}</select></label><label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Horizonte<select value={rascunho.horizonte} onChange={(event) => setRascunho((atual) => ({ ...atual, horizonte: Number(event.target.value) as CenarioSimulacao['horizonte'] }))} className="mt-1.5 w-full rounded-[var(--radius-controle)] border border-borda bg-superficie px-3 py-2 text-sm dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-medio-dark">{[3, 6, 12, 18, 24].map((meses) => <option key={meses} value={meses}>{meses} meses</option>)}</select></label></div></div>

          <div className="overflow-hidden rounded-2xl border border-borda bg-superficie dark:border-borda-dark dark:bg-navy"><div className="flex flex-col gap-3 border-b border-borda p-4 dark:border-borda-dark sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Grade anual editável</h2><p className="mt-0.5 text-xs text-texto-medio">Valores em R$. As linhas cinzas vêm dos lançamentos reais; edite apenas as linhas planejadas.</p></div><div className="flex gap-2"><button type="button" onClick={() => adicionarLinha('receita_planejada')} className="inline-flex items-center gap-1 rounded-[var(--radius-controle)] bg-sucesso-suave px-3 py-2 text-xs font-semibold text-white hover:bg-sucesso-suave"><TrendingUp className="h-3.5 w-3.5" /> Receita</button><button type="button" onClick={() => adicionarLinha('despesa_planejada')} className="inline-flex items-center gap-1 rounded-[var(--radius-controle)] bg-perigo-suave px-3 py-2 text-xs font-semibold text-white hover:bg-perigo-suave"><TrendingDown className="h-3.5 w-3.5" /> Despesa</button></div></div>
            <div className="overflow-x-auto"><table className="min-w-[1450px] w-full border-collapse text-xs"><thead className="bg-fundo-sutil dark:bg-superficie-dark"><tr><th className="sticky left-0 z-20 min-w-[210px] bg-fundo-sutil p-3 text-left text-[10px] font-bold uppercase tracking-wide text-texto-medio dark:bg-superficie-dark">Linha</th>{mesesDaGrade.map((mes) => <th key={mes} className="min-w-[92px] p-2 text-center text-[10px] font-bold uppercase text-texto-medio">{formatarMesCompetencia(mes)}</th>)}</tr></thead><tbody><tr className="border-t border-borda bg-fundo-sutil/70 dark:border-borda-dark dark:bg-superficie-dark/40"><td className="sticky left-0 z-10 bg-fundo-sutil p-3 font-semibold text-texto-medio dark:bg-superficie-dark">Receitas reais / base</td>{mesesDaGrade.map((mes) => <td key={mes} className="p-2 text-right tabular-nums text-texto-medio">{formatarMoeda(valoresBase[mes].receitas)}</td>)}</tr><tr className="border-t border-borda bg-fundo-sutil/70 dark:border-borda-dark dark:bg-superficie-dark/40"><td className="sticky left-0 z-10 bg-fundo-sutil p-3 font-semibold text-texto-medio dark:bg-superficie-dark">Despesas reais / base</td>{mesesDaGrade.map((mes) => <td key={mes} className="p-2 text-right tabular-nums text-texto-medio">{formatarMoeda(valoresBase[mes].despesas)}</td>)}</tr><tr><td colSpan={13} className="sticky left-0 bg-sucesso-suave px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-sucesso dark:bg-superficie-dark/30 dark:text-texto-forte-dark">Receitas planejadas</td></tr>{receitasPlanejadas.length === 0 && <tr><td colSpan={13} className="p-3 text-center text-xs text-texto-medio">Clique em “Receita” para adicionar uma linha.</td></tr>}{receitasPlanejadas.map((item) => linhaEditavel(item, true))}<tr className="border-y border-sucesso bg-sucesso-suave/60 font-bold dark:border-borda-dark dark:bg-superficie-dark/20"><td className="sticky left-0 z-10 bg-sucesso-suave p-3 text-sucesso dark:bg-superficie-dark dark:text-texto-forte-dark">Total de receitas no cenário</td>{mesesDaGrade.map((mes) => <td key={mes} className="p-2 text-right tabular-nums text-sucesso dark:text-texto-forte-dark">{formatarMoeda(valoresBase[mes].receitas + totalItensNoMes(mes, 'receita_planejada'))}</td>)}</tr><tr><td colSpan={13} className="sticky left-0 bg-perigo-suave px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-perigo dark:bg-superficie-dark/30 dark:text-texto-forte-dark">Despesas planejadas</td></tr>{despesasPlanejadas.length === 0 && <tr><td colSpan={13} className="p-3 text-center text-xs text-texto-medio">Clique em “Despesa” para adicionar uma linha.</td></tr>}{despesasPlanejadas.map((item) => linhaEditavel(item, false))}<tr className="border-y border-perigo bg-perigo-suave/60 font-bold dark:border-borda-dark dark:bg-superficie-dark/20"><td className="sticky left-0 z-10 bg-perigo-suave p-3 text-perigo dark:bg-superficie-dark dark:text-texto-forte-dark">Total de despesas no cenário</td>{mesesDaGrade.map((mes) => <td key={mes} className="p-2 text-right tabular-nums text-perigo dark:text-texto-forte-dark">{formatarMoeda(valoresBase[mes].despesas + totalItensNoMes(mes, 'despesa_planejada'))}</td>)}</tr><tr className="bg-primaria-suave font-bold dark:bg-navy-claro/25"><td className="sticky left-0 z-10 bg-primaria-suave p-3 text-primaria dark:bg-navy-claro dark:text-primaria-clara">Resultado previsto</td>{mesesDaGrade.map((mes) => <td key={mes} className="p-2 text-right tabular-nums text-primaria dark:text-primaria-clara">{formatarMoeda(valoresBase[mes].receitas + totalItensNoMes(mes, 'receita_planejada') - valoresBase[mes].despesas - totalItensNoMes(mes, 'despesa_planejada'))}</td>)}</tr></tbody></table></div>
          </div>
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-borda bg-superficie p-4 dark:border-borda-dark dark:bg-navy sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Detalhar valores do cenário</h2><p className="mt-1 text-xs text-texto-medio">Abra a origem dos totais para simular clientes, contratos e despesas que já existem.</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => setDetalheAberto('receita')} className="rounded-[var(--radius-controle)] border border-sucesso px-3 py-2 text-xs font-semibold text-sucesso hover:bg-sucesso-suave dark:border-borda-dark dark:text-texto-forte-dark">Abrir receitas</button><button type="button" onClick={() => setDetalheAberto('despesa')} className="rounded-[var(--radius-controle)] border border-perigo px-3 py-2 text-xs font-semibold text-perigo hover:bg-perigo-suave dark:border-borda-dark dark:text-texto-forte-dark">Abrir despesas</button></div>
          </div>
          <div className="grade-detalhada rounded-2xl border border-borda bg-superficie dark:border-borda-dark dark:bg-navy">
            <div className="flex items-center justify-between border-b border-borda p-4 dark:border-borda-dark"><div><h2 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Fluxo de caixa anual detalhado</h2><p className="mt-1 text-xs text-texto-medio">Meses passados são históricos do Asaas. A partir de {formatarMesCompetencia(mesSelecionado)}, os valores podem ser simulados.</p></div><div className="flex gap-2"><button type="button" onClick={() => adicionarLinha('receita_planejada')} className="rounded-[var(--radius-controle)] bg-sucesso-suave px-3 py-2 text-xs font-semibold text-white">+ Receita</button><button type="button" onClick={() => adicionarLinha('despesa_planejada')} className="rounded-[var(--radius-controle)] bg-perigo-suave px-3 py-2 text-xs font-semibold text-white">+ Despesa</button></div></div>
            <div className="overflow-x-auto"><table className="min-w-[1450px] w-full border-collapse text-xs"><thead className="bg-fundo-sutil dark:bg-superficie-dark"><tr><th className="sticky left-0 z-20 min-w-[230px] bg-fundo-sutil p-3 text-left text-[10px] font-bold uppercase text-texto-medio dark:bg-superficie-dark">Resultado</th>{mesesDaGrade.map((mes) => <th key={mes} className={`min-w-[92px] p-2 text-center text-[10px] font-bold uppercase ${mesPodeSerEditado(mes) ? 'text-primaria' : 'text-texto-medio'}`}>{formatarMesCompetencia(mes)}</th>)}</tr></thead><tbody>{(['receita', 'despesa'] as const).map((tipo) => <React.Fragment key={tipo}><tr><td colSpan={13} className={`sticky left-0 px-3 py-2 text-[10px] font-bold uppercase ${tipo === 'receita' ? 'bg-sucesso-suave text-sucesso' : 'bg-perigo-suave text-perigo'}`}>{tipo === 'receita' ? '1. Receitas' : '2. Despesas'}</td></tr>{linhasBase.filter((linha) => linha.tipo === tipo).map((linha) => <tr key={linha.id} className="border-t border-borda dark:border-borda-dark"><td className="sticky left-0 z-10 min-w-[230px] bg-superficie p-2 font-medium text-texto-medio dark:bg-navy dark:text-texto-medio-dark">{linha.descricao}</td>{mesesDaGrade.map((mes) => <td key={mes} className="min-w-[92px] p-1 text-right">{mesPodeSerEditado(mes) ? <input type="number" min="0" value={valorLinhaNoCenario(linha, mes) ? valorLinhaNoCenario(linha, mes) / 100 : ''} onChange={(event) => atualizarBaseNoCenario(linha.id, mes, event.target.value)} placeholder="–" className="w-full rounded border border-transparent bg-primaria-suave/60 px-2 py-1.5 text-right text-xs tabular-nums text-primaria outline-none hover:border-primaria focus:border-primaria dark:bg-navy-claro/20 dark:text-primaria-clara" /> : <span className="tabular-nums text-texto-medio">{formatarMoeda(linha.valores[mes] || 0)}</span>}</td>)}</tr>)}</React.Fragment>)}</tbody></table></div>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-borda bg-navy dark:border-borda-dark dark:bg-superficie-dark">
            <table className="min-w-[1450px] w-full border-collapse text-xs">
              <tbody>
                <tr className="font-bold text-white">
                  <td className="sticky left-0 z-10 min-w-[210px] bg-navy p-3 dark:bg-superficie-dark">
                    <span className="block">Saldo do fluxo de caixa</span>
                    <span className="mt-0.5 block text-[9px] font-medium text-texto-medio">Extrato Asaas + projeções da grade</span>
                  </td>
                  {mesesDaGrade.map((mes) => (
                    <td key={mes} className={`min-w-[92px] p-2 text-right tabular-nums ${saldoFluxoMensal[mes] < 0 ? 'text-perigo' : 'text-sucesso'}`}>
                      {formatarMoeda(saldoFluxoMensal[mes])}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

        </section>
        {detalheAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-fundo-sutil/50 p-4 backdrop-blur-sm" onClick={() => setDetalheAberto(null)}>
            <section role="dialog" aria-modal="true" className="flex max-h-[90vh] w-[96vw] max-w-[1700px] flex-col overflow-hidden rounded-2xl bg-superficie shadow-2xl dark:bg-navy" onClick={(event) => event.stopPropagation()}>
              <header className="flex items-start justify-between gap-4 border-b border-borda p-5 dark:border-borda-dark"><div><h2 className="text-lg font-bold text-texto-medio dark:text-texto-medio-dark">{detalheAberto === 'receita' ? 'Receitas que formam o cenário' : 'Despesas que formam o cenário'}</h2><p className="mt-1 text-xs text-texto-medio">Histórico bloqueado · {formatarMesCompetencia(mesSelecionado)} e meses seguintes são editáveis somente neste cenário.</p></div><div className="flex items-center gap-2"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-medio" /><input autoFocus value={buscaDetalhe} onChange={(event) => setBuscaDetalhe(event.target.value)} placeholder="Buscar lançamento..." className="w-56 rounded-[var(--radius-controle)] border border-borda py-2 pl-9 pr-3 text-xs outline-none focus:border-primaria dark:border-borda-dark dark:bg-superficie-dark" /></label><button type="button" onClick={() => { setDetalheAberto(null); setBuscaDetalhe(''); }} className="rounded-[var(--radius-controle)] p-2 text-texto-medio hover:bg-fundo-sutil hover:text-texto-medio" aria-label="Fechar"><X className="h-5 w-5" /></button></div></header>
              <div className="overflow-auto p-4"><table className="min-w-[1450px] w-full border-collapse text-xs"><thead className="sticky top-0 bg-fundo-sutil dark:bg-superficie-dark"><tr><th className="sticky left-0 z-20 min-w-[250px] bg-fundo-sutil p-3 text-left text-[10px] font-bold uppercase text-texto-medio dark:bg-superficie-dark">Descrição / origem Asaas</th>{mesesDaGrade.map((mes) => <th key={mes} className={`min-w-[92px] p-2 text-center text-[10px] font-bold uppercase ${mesPodeSerEditado(mes) ? 'text-primaria' : 'text-texto-medio'}`}>{formatarMesCompetencia(mes)}</th>)}</tr></thead><tbody>{linhasDetalheAgrupadas.length === 0 ? <tr><td colSpan={13} className="p-6 text-center text-texto-medio">Nenhum lançamento encontrado.</td></tr> : linhasDetalheAgrupadas.map(([categoria, linhas]) => <React.Fragment key={categoria}><tr><td colSpan={13} className="bg-fundo-sutil p-0 dark:bg-superficie-dark"><button type="button" onClick={() => setCategoriasFechadas((atual) => ({ ...atual, [categoria]: !atual[categoria] }))} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-texto-medio dark:text-texto-medio-dark">{categoriasFechadas[categoria] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{categoria}<span className="ml-1 rounded-full bg-superficie px-1.5 py-0.5 text-[9px] text-texto-medio dark:bg-superficie-dark">{linhas.length}</span></button></td></tr>{!categoriasFechadas[categoria] && linhas.map((linha) => <tr key={linha.id} className="border-t border-borda dark:border-borda-dark"><td className="sticky left-0 z-10 min-w-[250px] bg-superficie p-2 font-medium text-texto-medio dark:bg-navy dark:text-texto-medio-dark">{linha.descricao}</td>{mesesDaGrade.map((mes) => <td key={mes} className="min-w-[92px] p-1 text-right">{mesPodeSerEditado(mes) ? <input type="number" min="0" value={valorLinhaNoCenario(linha, mes) ? valorLinhaNoCenario(linha, mes) / 100 : ''} onChange={(event) => atualizarBaseNoCenario(linha.id, mes, event.target.value)} placeholder="–" className="w-full rounded border border-transparent bg-primaria-suave/60 px-2 py-1.5 text-right text-xs tabular-nums text-primaria outline-none hover:border-primaria focus:border-primaria dark:bg-navy-claro/20 dark:text-primaria-clara" /> : <span className="tabular-nums text-texto-medio">{formatarMoeda(linha.valores[mes] || 0)}</span>}</td>)}</tr>)}</React.Fragment>)}</tbody></table></div>
            </section>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-borda bg-superficie p-4 dark:border-borda-dark dark:bg-navy"><span className="text-xs font-semibold text-texto-medio">Saldo base</span><strong className="mt-2 block text-xl text-texto-medio dark:text-texto-medio-dark">{formatarMoeda(resumo.saldoBase)}</strong></div><div className="rounded-2xl border border-primaria bg-primaria-suave/50 p-4 dark:border-borda-dark dark:bg-navy-claro/20"><span className="text-xs font-semibold text-primaria dark:text-primaria-clara">Saldo no cenário</span><strong className="mt-2 block text-xl text-primaria dark:text-primaria-clara">{formatarMoeda(resumo.saldoCenario)}</strong></div><div className="rounded-2xl border border-borda bg-superficie p-4 dark:border-borda-dark dark:bg-navy"><span className="text-xs font-semibold text-texto-medio">Situação do caixa</span><strong className={`mt-2 block text-xl ${resumo.caixaNegativo ? 'text-perigo' : 'text-sucesso'}`}>{resumo.caixaNegativo ? `Negativo em ${formatarMesCompetencia(resumo.caixaNegativo)}` : 'Positivo no horizonte'}</strong></div></div>

      <div className="rounded-2xl border border-borda bg-superficie p-5 dark:border-borda-dark dark:bg-navy"><h2 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">Projeção de caixa</h2><p className="mb-4 mt-1 text-xs text-texto-medio">A grade anual alimenta automaticamente este comparativo.</p><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={dadosProjecao} margin={{ top: 12, right: 12, left: 8, bottom: 0 }}><XAxis dataKey="mesLabel" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(valor) => `R$ ${(Number(valor) / 1000).toFixed(0)}k`} /><Tooltip formatter={(valor: number) => formatarMoeda(valor)} contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }} /><Line type="monotone" dataKey="saldoBase" name="Plano base" stroke="#94a3b8" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="saldoCenario" name="Cenário anual" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></div>
    </div>
  );
};
