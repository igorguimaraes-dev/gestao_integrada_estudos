import { Lancamento, StatusLancamento, ContaBancaria } from '../types';
import { getDataHojeISO } from './formatters';

/**
 * Verifica se data cai em fim de semana e avança para próxima segunda-feira se solicitado
 */
export function ajustarParaProximoDiaUtil(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0) {
    // Domingo -> Segunda (+1 dia)
    data.setDate(data.getDate() + 1);
  } else if (diaSemana === 6) {
    // Sábado -> Segunda (+2 dias)
    data.setDate(data.getDate() + 2);
  }
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adiciona meses a uma data YYYY-MM-DD mantendo o dia se possível
 */
export function adicionarMeses(dataISO: string, meses: number, manterDia?: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const diaAlvo = manterDia || dia;
  const novaData = new Date(ano, mes - 1 + meses, 1);
  const ultimoDiaDoMes = new Date(novaData.getFullYear(), novaData.getMonth() + 1, 0).getDate();
  const diaFinal = Math.min(diaAlvo, ultimoDiaDoMes);
  
  const y = novaData.getFullYear();
  const m = String(novaData.getMonth() + 1).padStart(2, '0');
  const d = String(diaFinal).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adiciona dias a uma data YYYY-MM-DD
 */
export function adicionarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula status do lançamento com base nas regras:
 * - Cancelado: se status gravado for cancelado
 * - Realizado: realizado igual ao orçado
 * - Parcial: realizado menor que orçado e maior que 0
 * - Divergente: realizado diferente do orçado, com justificativa
 * - Vencido: data passou e não há realizado
 * - Previsto: futuro, sem realizado
 */
export function calcularStatusLancamento(lancamento: {
  status?: StatusLancamento;
  valorOrcado: number;
  valorRealizado?: number;
  dataVencimento: string;
  dataPagamento?: string;
  justificativaDivergencia?: string;
}): StatusLancamento {
  if (lancamento.status === 'cancelado') {
    return 'cancelado';
  }

  const hoje = getDataHojeISO();

  if (lancamento.valorRealizado !== undefined && lancamento.valorRealizado !== null) {
    if (lancamento.valorRealizado === lancamento.valorOrcado) {
      return 'realizado';
    }
    if (lancamento.valorRealizado > 0 && lancamento.valorRealizado < lancamento.valorOrcado) {
      return 'parcial';
    }
    if (lancamento.valorRealizado !== lancamento.valorOrcado) {
      return 'divergente';
    }
  }

  // Sem valor realizado
  if (lancamento.dataVencimento < hoje) {
    return 'vencido';
  }

  return 'previsto';
}

/**
 * Gera parcelas para lançamentos parcelados
 * Ajusta centavos na última parcela
 */
export interface GerarParcelasParams {
  descricaoBase: string;
  tipo: 'receita' | 'despesa';
  categoriaId: string;
  subcategoria: string;
  grupo: string;
  clienteId?: string;
  fornecedorId?: string;
  contaBancariaId: string;
  formaPagamento: Lancamento['formaPagamento'];
  totalParcelas: number;
  valorTotalCents?: number;
  valorParcelaCents?: number;
  valorEntradaCents?: number;
  dataPrimeiraParcela: string; // YYYY-MM-DD
  ajustarFimDeSemana?: boolean;
}

export function gerarLancamentosParcelados(params: GerarParcelasParams): Omit<Lancamento, 'id'>[] {
  const {
    descricaoBase,
    tipo,
    categoriaId,
    subcategoria,
    grupo,
    clienteId,
    fornecedorId,
    contaBancariaId,
    formaPagamento,
    totalParcelas,
    valorTotalCents,
    valorParcelaCents,
    valorEntradaCents = 0,
    dataPrimeiraParcela,
    ajustarFimDeSemana = false,
  } = params;

  const resultado: Omit<Lancamento, 'id'>[] = [];
  const serieId = `serie_parc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let valorTotalRestante = 0;
  let valorBaseParcela = 0;

  if (valorTotalCents && valorTotalCents > 0) {
    valorTotalRestante = valorTotalCents - valorEntradaCents;
    valorBaseParcela = Math.floor(valorTotalRestante / totalParcelas);
  } else if (valorParcelaCents && valorParcelaCents > 0) {
    valorBaseParcela = valorParcelaCents;
    valorTotalRestante = valorParcelaCents * totalParcelas;
  }

  // Se houver entrada
  if (valorEntradaCents > 0) {
    let dtVenc = dataPrimeiraParcela;
    if (ajustarFimDeSemana) dtVenc = ajustarParaProximoDiaUtil(dtVenc);
    const mesComp = dtVenc.substring(0, 7);

    resultado.push({
      tipo,
      descricao: `${descricaoBase} (Entrada)`,
      categoriaId,
      subcategoria,
      grupo,
      clienteId,
      fornecedorId,
      contaBancariaId,
      mesCompetencia: mesComp,
      dataVencimento: dtVenc,
      valorOrcado: valorEntradaCents,
      formaPagamento,
      status: calcularStatusLancamento({
        valorOrcado: valorEntradaCents,
        dataVencimento: dtVenc,
      }),
      conciliado: false,
      tags: ['Entrada'],
      serieId,
      numeroParcela: 0,
      totalParcelas,
    });
  }

  // Parcelas normais
  let acumuladoParcelas = 0;
  const diaBase = parseInt(dataPrimeiraParcela.split('-')[2], 10);

  for (let i = 1; i <= totalParcelas; i++) {
    // Se for a última parcela, adiciona o arredondamento de centavos
    let valorParcelaAtual = valorBaseParcela;
    if (i === totalParcelas && valorTotalRestante > 0) {
      valorParcelaAtual = valorTotalRestante - acumuladoParcelas;
    } else {
      acumuladoParcelas += valorBaseParcela;
    }

    // Calcula data do mês i - 1
    let dtVenc = adicionarMeses(dataPrimeiraParcela, i - 1, diaBase);
    if (ajustarFimDeSemana) {
      dtVenc = ajustarParaProximoDiaUtil(dtVenc);
    }
    const mesComp = dtVenc.substring(0, 7);

    resultado.push({
      tipo,
      descricao: `${descricaoBase} (${i}/${totalParcelas})`,
      categoriaId,
      subcategoria,
      grupo,
      clienteId,
      fornecedorId,
      contaBancariaId,
      mesCompetencia: mesComp,
      dataVencimento: dtVenc,
      valorOrcado: valorParcelaAtual,
      formaPagamento,
      status: calcularStatusLancamento({
        valorOrcado: valorParcelaAtual,
        dataVencimento: dtVenc,
      }),
      conciliado: false,
      tags: ['Parcelado'],
      serieId,
      numeroParcela: i,
      totalParcelas,
    });
  }

  return resultado;
}

/**
 * Gera ocorrências para lançamentos recorrentes
 */
export interface GerarRecorrentesParams {
  descricao: string;
  tipo: 'receita' | 'despesa';
  categoriaId: string;
  subcategoria: string;
  grupo: string;
  clienteId?: string;
  fornecedorId?: string;
  contaBancariaId: string;
  formaPagamento: Lancamento['formaPagamento'];
  valorCents: number;
  frequencia: 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  dataInicio: string; // YYYY-MM-DD
  terminoTipo: 'sem_fim' | 'apos_n' | 'ate_data';
  numeroOcorrencias?: number;
  dataFim?: string;
  ajustarFimDeSemana?: boolean;
  reajusteAnualPct?: number;
  mesReajuste?: number; // 1-12
  horizonteMeses?: number; // default 24
}

export function gerarLancamentosRecorrentes(params: GerarRecorrentesParams): Omit<Lancamento, 'id'>[] {
  const {
    descricao,
    tipo,
    categoriaId,
    subcategoria,
    grupo,
    clienteId,
    fornecedorId,
    contaBancariaId,
    formaPagamento,
    valorCents,
    frequencia,
    dataInicio,
    terminoTipo,
    numeroOcorrencias = 12,
    dataFim,
    ajustarFimDeSemana = false,
    reajusteAnualPct = 0,
    mesReajuste,
    horizonteMeses = 24,
  } = params;

  const resultado: Omit<Lancamento, 'id'>[] = [];
  const serieId = `serie_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Determinar limite máximo de ocorrências ou meses
  let maxOcorrencias = 120;
  if (terminoTipo === 'apos_n' && numeroOcorrencias) {
    maxOcorrencias = numeroOcorrencias;
  }

  const [anoInicio, mesIni, diaIni] = dataInicio.split('-').map(Number);
  const dataMaxHorizonte = adicionarMeses(dataInicio, horizonteMeses);

  let dataAtual = dataInicio;
  let ocorrenciaAtual = 1;

  while (ocorrenciaAtual <= maxOcorrencias) {
    if (terminoTipo === 'ate_data' && dataFim && dataAtual > dataFim) {
      break;
    }
    if (terminoTipo === 'sem_fim' && dataAtual > dataMaxHorizonte) {
      break;
    }

    let dataVencimentoFinal = dataAtual;
    if (ajustarFimDeSemana) {
      dataVencimentoFinal = ajustarParaProximoDiaUtil(dataAtual);
    }
    const mesCompetencia = dataVencimentoFinal.substring(0, 7);

    // Calcular reajuste se configurado
    let valorFinal = valorCents;
    if (reajusteAnualPct > 0) {
      const anoCorrente = parseInt(dataVencimentoFinal.split('-')[0], 10);
      const mesAtual = parseInt(dataVencimentoFinal.split('-')[1], 10);
      const anosDiferenca = anoCorrente - anoInicio;
      if (anosDiferenca > 0 && (!mesReajuste || mesAtual >= mesReajuste)) {
        const fator = Math.pow(1 + reajusteAnualPct / 100, anosDiferenca);
        valorFinal = Math.round(valorCents * fator);
      }
    }

    resultado.push({
      tipo,
      descricao: `${descricao} (${ocorrenciaAtual})`,
      categoriaId,
      subcategoria,
      grupo,
      clienteId,
      fornecedorId,
      contaBancariaId,
      mesCompetencia,
      dataVencimento: dataVencimentoFinal,
      valorOrcado: valorFinal,
      formaPagamento,
      status: calcularStatusLancamento({
        valorOrcado: valorFinal,
        dataVencimento: dataVencimentoFinal,
      }),
      conciliado: false,
      tags: ['Recorrente'],
      serieId,
      numeroParcela: ocorrenciaAtual,
      tipoRecorrencia: frequencia,
    });

    ocorrenciaAtual++;

    // Próxima data de acordo com a frequência
    if (frequencia === 'semanal') {
      dataAtual = adicionarDias(dataAtual, 7);
    } else if (frequencia === 'quinzenal') {
      dataAtual = adicionarDias(dataAtual, 14);
    } else if (frequencia === 'mensal') {
      dataAtual = adicionarMeses(dataInicio, ocorrenciaAtual - 1, diaIni);
    } else if (frequencia === 'bimestral') {
      dataAtual = adicionarMeses(dataInicio, (ocorrenciaAtual - 1) * 2, diaIni);
    } else if (frequencia === 'trimestral') {
      dataAtual = adicionarMeses(dataInicio, (ocorrenciaAtual - 1) * 3, diaIni);
    } else if (frequencia === 'semestral') {
      dataAtual = adicionarMeses(dataInicio, (ocorrenciaAtual - 1) * 6, diaIni);
    } else if (frequencia === 'anual') {
      dataAtual = adicionarMeses(dataInicio, (ocorrenciaAtual - 1) * 12, diaIni);
    }
  }

  return resultado;
}

/**
 * Calcula saldo atual de uma conta bancária:
 * Saldo inicial + soma dos realizados daquela conta a partir da data do saldo inicial
 * Leva em consideração transferências de saída e entrada
 */
export function calcularSaldoConta(
  conta: ContaBancaria,
  lancamentos: Lancamento[]
): {
  saldoAtual: number; // centavos
  entradasRealizadas: number;
  saidasRealizadas: number;
} {
  let saldo = conta.saldoInicial;
  let entradasRealizadas = 0;
  let saidasRealizadas = 0;

  for (const l of lancamentos) {
    if (l.status === 'cancelado') continue;
    
    // Considera apenas transações realizadas ou com valor realizado registrado
    const valorMovimento = l.valorRealizado !== undefined ? l.valorRealizado : (l.status === 'realizado' ? l.valorOrcado : 0);
    if (!valorMovimento || valorMovimento <= 0) continue;

    const dataEfetiva = l.dataPagamento || l.dataVencimento;
    // Movimento a partir da data do saldo inicial
    if (dataEfetiva < conta.dataSaldoInicial) continue;

    if (l.tipo === 'receita' && l.contaBancariaId === conta.id) {
      saldo += valorMovimento;
      entradasRealizadas += valorMovimento;
    } else if (l.tipo === 'despesa' && l.contaBancariaId === conta.id) {
      saldo -= valorMovimento;
      saidasRealizadas += valorMovimento;
    } else if (l.tipo === 'transferencia') {
      // Saída da conta de origem
      if (l.contaBancariaId === conta.id) {
        saldo -= valorMovimento;
        saidasRealizadas += valorMovimento;
      }
      // Entrada na conta de destino
      if (l.contaDestinoId === conta.id) {
        saldo += valorMovimento;
        entradasRealizadas += valorMovimento;
      }
    }
  }

  return {
    saldoAtual: saldo,
    entradasRealizadas,
    saidasRealizadas,
  };
}

/**
 * Projeta o valor de um lançamento:
 * Usa realizado se existir; caso contrário usa orçado se não cancelado
 */
export function obterValorEfetivoLancamento(lancamento: Lancamento): number {
  if (lancamento.status === 'cancelado') return 0;
  if (lancamento.valorRealizado !== undefined && lancamento.valorRealizado !== null) {
    return lancamento.valorRealizado;
  }
  return lancamento.valorOrcado;
}

export interface ItemLinhaDRE {
  nivel?: number;
  chave?: string;
  categoriaId?: string;
  descricao: string;
  tipo: 'receita' | 'despesa' | 'totalizador' | 'subtotal';
  orcado: number; // centavos
  realizado: number; // centavos
  variacaoValor: number; // centavos (realizado - orcado)
  variacaoPercentual: number; // %
  status: 'dentro' | 'alerta' | 'estourado' | 'neutro';
  sublinhas?: ItemLinhaDRE[];
}

/**
 * Calcula matriz completa de DRE Gerencial para agência de marketing
 */
export function calcularMatrizDRE(
  lancamentos: Lancamento[],
  categorias: import('../types').Categoria[],
  metasOrcamentariasOuMeses?: any,
  regime?: any
): ItemLinhaDRE[] {
  // Lançamentos não cancelados
  const validos = lancamentos.filter((l) => l.status !== 'cancelado');

  // Helper para somar orçado e realizado
  const somar = (filtro: (l: Lancamento) => boolean) => {
    let orcado = 0;
    let realizado = 0;
    validos.filter(filtro).forEach((l) => {
      orcado += l.valorOrcado || 0;
      realizado += l.valorRealizado !== undefined ? l.valorRealizado : (l.status === 'realizado' ? l.valorOrcado : 0);
    });
    return { orcado, realizado };
  };

  const calcularStatus = (orcado: number, realizado: number, tipo: 'receita' | 'despesa'): 'dentro' | 'alerta' | 'estourado' | 'neutro' => {
    if (orcado === 0 && realizado === 0) return 'neutro';
    if (tipo === 'despesa') {
      if (orcado > 0 && realizado > orcado) return 'estourado';
      if (orcado > 0 && realizado >= orcado * 0.9) return 'alerta';
      return 'dentro';
    } else {
      if (orcado > 0 && realizado < orcado * 0.8) return 'alerta';
      return 'dentro';
    }
  };

  const criarLinha = (
    descricao: string,
    tipo: 'receita' | 'despesa' | 'totalizador' | 'subtotal',
    orcado: number,
    realizado: number,
    chave?: string,
    categoriaId?: string,
    sublinhas?: ItemLinhaDRE[]
  ): ItemLinhaDRE => {
    const variacaoValor = realizado - orcado;
    const variacaoPercentual = orcado !== 0 ? (variacaoValor / Math.abs(orcado)) * 100 : 0;
    const status = tipo === 'totalizador' || tipo === 'subtotal' ? 'neutro' : calcularStatus(orcado, realizado, tipo);
    return {
      chave,
      categoriaId,
      descricao,
      tipo,
      orcado,
      realizado,
      variacaoValor,
      variacaoPercentual,
      status,
      sublinhas,
    };
  };

  // 1. Receita Bruta de Serviços
  const recs = somar((l) => l.tipo === 'receita' && !/estorno|devolu/i.test(l.subcategoria || ''));
  const linhaReceitaBruta = criarLinha('1. RECEITA BRUTA DE SERVIÇOS', 'receita', recs.orcado, recs.realizado, 'Receitas');

  // 2. Deduções da Receita Bruta (Impostos s/ NFS-e, Simples Nacional, ISS)
  const deds = somar((l) => l.tipo === 'despesa' && /imposto|tributo|iss|simples|irpj|csll|cofins|pis/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`));
  const linhaDeducoes = criarLinha('2. (-) Impostos e Deduções Diretas', 'despesa', deds.orcado, deds.realizado, 'Impostos');

  // 3. Receita Líquida Operacional (1 - 2)
  const recLiqOrc = recs.orcado - deds.orcado;
  const recLiqReal = recs.realizado - deds.realizado;
  const linhaReceitaLiquida = criarLinha('(=) RECEITA LÍQUIDA OPERACIONAL', 'subtotal', recLiqOrc, recLiqReal);

  // 4. Custos dos Serviços Prestados (CSP) - Equipe PJ, Freelancers, Ferramentas Diretas de Clientes
  const csp = somar((l) => l.tipo === 'despesa' && /prestador|pj|freela|redator|designer|coprodu|trafego|producao/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`));
  const linhaCSP = criarLinha('3. (-) Custos dos Serviços Prestados (Equipe PJ / Freelancers)', 'despesa', csp.orcado, csp.realizado, 'Custos');

  // 5. Lucro Bruto Operacional (Receita Líquida - CSP)
  const lucroBrutoOrc = recLiqOrc - csp.orcado;
  const lucroBrutoReal = recLiqReal - csp.realizado;
  const linhaLucroBruto = criarLinha('(=) MARGEM / LUCRO BRUTO', 'subtotal', lucroBrutoOrc, lucroBrutoReal);

  // 6. Despesas Operacionais (Administrativas, Marketing Próprio, Softwares Gerais, Infraestrutura)
  const despos = somar((l) => l.tipo === 'despesa' &&
    !/imposto|tributo|iss|simples|irpj|csll|cofins|pis/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`) &&
    !/prestador|pj|freela|redator|designer|coprodu|trafego|producao/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`) &&
    !/pro-labore|distribui|lucro socio|socio/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`)
  );
  const linhaDespesasOp = criarLinha('4. (-) Despesas Operacionais e Administrativas', 'despesa', despos.orcado, despos.realizado, 'Operacionais');

  // 7. EBITDA / Resultado Operacional (Lucro Bruto - Despesas Operacionais)
  const ebitdaOrc = lucroBrutoOrc - despos.orcado;
  const ebitdaReal = lucroBrutoReal - despos.realizado;
  const linhaEbitda = criarLinha('(=) EBITDA / RESULTADO OPERACIONAL', 'totalizador', ebitdaOrc, ebitdaReal);

  // 8. Pró-labore & Distribuição de Lucros
  const proLabore = somar((l) => l.tipo === 'despesa' && /pro-labore|distribui|lucro socio|socio/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`));
  const linhaSocios = criarLinha('5. (-) Pró-labore e Distribuição aos Sócios', 'despesa', proLabore.orcado, proLabore.realizado, 'Sócios');

  // 9. Resultado Líquido Final do Exercício
  const resLiqOrc = ebitdaOrc - proLabore.orcado;
  const resLiqReal = ebitdaReal - proLabore.realizado;
  const linhaResultadoLiquido = criarLinha('(=) RESULTADO LÍQUIDO DO EXERCÍCIO', 'totalizador', resLiqOrc, resLiqReal);

  return [
    linhaReceitaBruta,
    linhaDeducoes,
    linhaReceitaLiquida,
    linhaCSP,
    linhaLucroBruto,
    linhaDespesasOp,
    linhaEbitda,
    linhaSocios,
    linhaResultadoLiquido,
  ];
}

export interface LinhaDREMatriz {
  id: string;
  descricao: string;
  isHeader?: boolean;
  isSubtotal?: boolean;
  nivel: number;
  valoresPorMes: Record<string, { orcado: number; realizado: number }>;
  total: { orcado: number; realizado: number };
}

export interface MatrizDRECompleta {
  meses: string[];
  linhas: LinhaDREMatriz[];
  resumo: {
    receitaBruta: { orcado: number; realizado: number };
    receitaLiquida: { orcado: number; realizado: number };
    lucroBruto: { orcado: number; realizado: number };
    ebitda: { orcado: number; realizado: number };
    resultadoLiquido: { orcado: number; realizado: number };
    margemLiquida: number; // %
  };
}

/**
 * Calcula a Matriz DRE Gerencial multi-período (mês a mês + totalizador)
 */
export function calcularMatrizDREPeriodos(
  lancamentos: Lancamento[],
  categorias: import('../types').Categoria[],
  meses: string[],
  regime: 'caixa' | 'competencia' = 'caixa'
): MatrizDRECompleta {
  const mesesOrdenados = [...meses].sort();

  // Helper para verificar se lançamento pertence ao mês no regime escolhido
  const lancamentoPertenceAoMes = (l: Lancamento, mes: string): boolean => {
    if (l.status === 'cancelado') return false;
    if (regime === 'caixa') {
      const dataRef = l.status === 'realizado' && l.dataPagamento ? l.dataPagamento : l.dataVencimento;
      return (dataRef || '').substring(0, 7) === mes;
    } else {
      const comp = l.mesCompetencia || (l.dataVencimento || '').substring(0, 7);
      return comp === mes;
    }
  };

  // Helper para somar orçado e realizado para um predicado em um mês específico
  const somarMes = (mes: string, filtro: (l: Lancamento) => boolean) => {
    let orcado = 0;
    let realizado = 0;
    lancamentos.forEach((l) => {
      if (lancamentoPertenceAoMes(l, mes) && filtro(l)) {
        orcado += l.valorOrcado || 0;
        realizado += l.valorRealizado !== undefined && l.valorRealizado !== null
          ? l.valorRealizado
          : (l.status === 'realizado' ? (l.valorOrcado || 0) : 0);
      }
    });
    return { orcado, realizado };
  };

  // Gerador de linha com histórico mensal e total
  const buildLinha = (
    id: string,
    descricao: string,
    nivel: number,
    opts: {
      isHeader?: boolean;
      isSubtotal?: boolean;
      filtro?: (l: Lancamento) => boolean;
      calcularFormula?: (mes: string) => { orcado: number; realizado: number };
    }
  ): LinhaDREMatriz => {
    const valoresPorMes: Record<string, { orcado: number; realizado: number }> = {};
    let totalOrcado = 0;
    let totalRealizado = 0;

    mesesOrdenados.forEach((mes) => {
      let val = { orcado: 0, realizado: 0 };
      if (opts.calcularFormula) {
        val = opts.calcularFormula(mes);
      } else if (opts.filtro) {
        val = somarMes(mes, opts.filtro);
      }
      valoresPorMes[mes] = val;
      totalOrcado += val.orcado;
      totalRealizado += val.realizado;
    });

    return {
      id,
      descricao,
      nivel,
      isHeader: opts.isHeader,
      isSubtotal: opts.isSubtotal,
      valoresPorMes,
      total: { orcado: totalOrcado, realizado: totalRealizado },
    };
  };

  // 1. Receitas
  // 1.1 Retainers Mensais
  const l1_1 = buildLinha('rec_retainer', '1.1 Retainers e Mensalidades Recorrentes', 1, {
    filtro: (l) => l.tipo === 'receita' && /retainer|fee|mensal|recorrente/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  // 1.2 Projetos Avulsos & Criação de Sites
  const l1_2 = buildLinha('rec_projetos', '1.2 Projetos Avulsos, Branding & Web', 1, {
    filtro: (l) => l.tipo === 'receita' && /projeto|site|branding|landing|avulso|identidade/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  // 1.3 Outras Receitas e Performance
  const l1_3 = buildLinha('rec_outras', '1.3 Bônus de Performance & Outras Receitas', 1, {
    filtro: (l) => l.tipo === 'receita' &&
      !/retainer|fee|mensal|recorrente/i.test(`${l.descricao} ${l.subcategoria}`) &&
      !/projeto|site|branding|landing|avulso|identidade/i.test(`${l.descricao} ${l.subcategoria}`) &&
      !/estorno|devolu/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  // 1.0 Total Receita Bruta
  const l1_0 = buildLinha('rec_bruta', '1. RECEITA BRUTA DE SERVIÇOS', 0, {
    isHeader: true,
    calcularFormula: (m) => ({
      orcado: (l1_1.valoresPorMes[m]?.orcado || 0) + (l1_2.valoresPorMes[m]?.orcado || 0) + (l1_3.valoresPorMes[m]?.orcado || 0),
      realizado: (l1_1.valoresPorMes[m]?.realizado || 0) + (l1_2.valoresPorMes[m]?.realizado || 0) + (l1_3.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 2. Deduções / Impostos
  const l2_1 = buildLinha('ded_impostos', '2.1 Impostos s/ Faturamento (Simples Nacional / ISS / NFS-e)', 1, {
    filtro: (l) => l.tipo === 'despesa' && /imposto|tributo|iss|simples|irpj|csll|cofins|pis|nfs/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`),
  });
  const l2_0 = buildLinha('ded_total', '2. (-) IMPOSTOS E DEDUÇÕES DIRETAS', 0, {
    isHeader: true,
    calcularFormula: (m) => l2_1.valoresPorMes[m] || { orcado: 0, realizado: 0 },
  });

  // 3. Receita Líquida Operacional (= 1 - 2)
  const l_rec_liq = buildLinha('rec_liquida', '(=) RECEITA LÍQUIDA OPERACIONAL', 0, {
    isSubtotal: true,
    calcularFormula: (m) => ({
      orcado: (l1_0.valoresPorMes[m]?.orcado || 0) - (l2_0.valoresPorMes[m]?.orcado || 0),
      realizado: (l1_0.valoresPorMes[m]?.realizado || 0) - (l2_0.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 4. Custos dos Serviços Prestados (CSP)
  const l4_1 = buildLinha('csp_equipe', '3.1 Equipe PJ & Freelancers (Tráfego, Design, Copy, Dev, Vídeo)', 1, {
    filtro: (l) => l.tipo === 'despesa' && /prestador|pj|freela|redator|designer|coprodu|trafego|producao|equipe|social media|video/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`),
  });
  const l4_2 = buildLinha('csp_ferramentas', '3.2 Ferramentas e Custos Diretos Alocados a Clientes', 1, {
    filtro: (l) => l.tipo === 'despesa' && /cliente|ferramenta cliente|servidor cliente/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  const l4_0 = buildLinha('csp_total', '3. (-) CUSTOS DOS SERVIÇOS PRESTADOS (CSP)', 0, {
    isHeader: true,
    calcularFormula: (m) => ({
      orcado: (l4_1.valoresPorMes[m]?.orcado || 0) + (l4_2.valoresPorMes[m]?.orcado || 0),
      realizado: (l4_1.valoresPorMes[m]?.realizado || 0) + (l4_2.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 5. Lucro Bruto Operacional (= Receita Líquida - CSP)
  const l_lucro_bruto = buildLinha('lucro_bruto', '(=) MARGEM / LUCRO BRUTO', 0, {
    isSubtotal: true,
    calcularFormula: (m) => ({
      orcado: (l_rec_liq.valoresPorMes[m]?.orcado || 0) - (l4_0.valoresPorMes[m]?.orcado || 0),
      realizado: (l_rec_liq.valoresPorMes[m]?.realizado || 0) - (l4_0.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 6. Despesas Operacionais (Administrativas, SaaS, Infra)
  const l6_1 = buildLinha('desp_saas', '4.1 Softwares, Plataformas & SaaS da Agência', 1, {
    filtro: (l) => l.tipo === 'despesa' && /software|saas|app|aplicativo|adobe|google|figma|notion|rd|semrush|zoom|aws|nuvem|hosting/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  const l6_2 = buildLinha('desp_bancarias', '4.2 Tarifas Bancárias, Juros, Taxas de Boleto e IOF', 1, {
    filtro: (l) => l.tipo === 'despesa' && /tarifa|taxa|juros|iof|banco|anuidade/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  const l6_3 = buildLinha('desp_adm', '4.3 Infraestrutura, Aluguel, Escritório e Outras Despesas Gerais', 1, {
    filtro: (l) => l.tipo === 'despesa' &&
      !/imposto|tributo|iss|simples|irpj|csll|cofins|pis|nfs/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`) &&
      !/prestador|pj|freela|redator|designer|coprodu|trafego|producao|equipe|social media|video/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`) &&
      !/software|saas|app|aplicativo|adobe|google|figma|notion|rd|semrush|zoom|aws|nuvem|hosting/i.test(`${l.descricao} ${l.subcategoria}`) &&
      !/tarifa|taxa|juros|iof|banco|anuidade/i.test(`${l.descricao} ${l.subcategoria}`) &&
      !/pro-labore|distribui|lucro socio|socio/i.test(`${l.descricao} ${l.subcategoria} ${l.grupo}`),
  });
  const l6_0 = buildLinha('desp_op_total', '4. (-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS', 0, {
    isHeader: true,
    calcularFormula: (m) => ({
      orcado: (l6_1.valoresPorMes[m]?.orcado || 0) + (l6_2.valoresPorMes[m]?.orcado || 0) + (l6_3.valoresPorMes[m]?.orcado || 0),
      realizado: (l6_1.valoresPorMes[m]?.realizado || 0) + (l6_2.valoresPorMes[m]?.realizado || 0) + (l6_3.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 7. EBITDA / Resultado Operacional (= Lucro Bruto - Despesas Operacionais)
  const l_ebitda = buildLinha('ebitda', '(=) EBITDA / RESULTADO OPERACIONAL', 0, {
    isSubtotal: true,
    calcularFormula: (m) => ({
      orcado: (l_lucro_bruto.valoresPorMes[m]?.orcado || 0) - (l6_0.valoresPorMes[m]?.orcado || 0),
      realizado: (l_lucro_bruto.valoresPorMes[m]?.realizado || 0) - (l6_0.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 8. Pró-labore e Distribuição aos Sócios
  const l8_1 = buildLinha('soc_prolabore', '5.1 Pró-labore dos Sócios Diretores', 1, {
    filtro: (l) => l.tipo === 'despesa' && /pro-labore|honorario socio/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  const l8_2 = buildLinha('soc_lucro', '5.2 Distribuição Isenta de Lucros / Dividendos', 1, {
    filtro: (l) => l.tipo === 'despesa' && /distribui|lucro socio|dividendo/i.test(`${l.descricao} ${l.subcategoria}`),
  });
  const l8_0 = buildLinha('soc_total', '5. (-) REMUNERAÇÃO E DISTRIBUIÇÃO AOS SÓCIOS', 0, {
    isHeader: true,
    calcularFormula: (m) => ({
      orcado: (l8_1.valoresPorMes[m]?.orcado || 0) + (l8_2.valoresPorMes[m]?.orcado || 0),
      realizado: (l8_1.valoresPorMes[m]?.realizado || 0) + (l8_2.valoresPorMes[m]?.realizado || 0),
    }),
  });

  // 9. Resultado Líquido Final (= EBITDA - Sócios)
  const l_res_liq = buildLinha('res_liquido', '(=) RESULTADO LÍQUIDO DO EXERCÍCIO', 0, {
    isSubtotal: true,
    calcularFormula: (m) => ({
      orcado: (l_ebitda.valoresPorMes[m]?.orcado || 0) - (l8_0.valoresPorMes[m]?.orcado || 0),
      realizado: (l_ebitda.valoresPorMes[m]?.realizado || 0) - (l8_0.valoresPorMes[m]?.realizado || 0),
    }),
  });

  const linhas = [
    l1_0,
    l1_1,
    l1_2,
    l1_3,
    l2_0,
    l2_1,
    l_rec_liq,
    l4_0,
    l4_1,
    l4_2,
    l_lucro_bruto,
    l6_0,
    l6_1,
    l6_2,
    l6_3,
    l_ebitda,
    l8_0,
    l8_1,
    l8_2,
    l_res_liq,
  ];

  const recBrutaReal = l1_0.total.realizado;
  const resLiqReal = l_res_liq.total.realizado;
  const margemLiquida = recBrutaReal > 0 ? (resLiqReal / recBrutaReal) * 100 : 0;

  return {
    meses: mesesOrdenados,
    linhas,
    resumo: {
      receitaBruta: l1_0.total,
      receitaLiquida: l_rec_liq.total,
      lucroBruto: l_lucro_bruto.total,
      ebitda: l_ebitda.total,
      resultadoLiquido: l_res_liq.total,
      margemLiquida,
    },
  };
}
