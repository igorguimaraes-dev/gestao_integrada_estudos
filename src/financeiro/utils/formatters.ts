/**
 * Formatador monetário brasileiro para centavos (inteiros) -> "R$ 1.234,56"
 */
let ocultarValoresFinanceiros = false;

export function definirOcultacaoDeValores(ocultar: boolean): void {
  ocultarValoresFinanceiros = ocultar;
}

export function formatarMoeda(centavos: number | undefined | null, incluirSimbolo: boolean = true): string {
  if (ocultarValoresFinanceiros) {
    return incluirSimbolo ? 'R$ ••••••' : '••••••';
  }

  if (centavos === undefined || centavos === null || isNaN(centavos)) {
    return incluirSimbolo ? 'R$ 0,00' : '0,00';
  }
  const valorReais = centavos / 100;
  const formatado = valorReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return incluirSimbolo ? `R$ ${formatado}` : formatado;
}

/**
 * Converte string digitada com máscara ou números para centavos (inteiro)
 * Ex: "R$ 1.250,50" -> 125050
 * Ex: "150" -> 15000 se interpretado como reais, ou do digitado
 */
export function parseValorParaCentavos(valor: string | number): number {
  if (typeof valor === 'number') {
    return Math.round(valor * 100);
  }
  if (!valor) return 0;
  // Remove tudo que não for dígito
  const apenasDigitos = valor.replace(/\D/g, '');
  if (!apenasDigitos) return 0;
  return parseInt(apenasDigitos, 10);
}

/**
 * Converte centavos para string formatada para input mascarado
 */
export function centavosParaInputMascarado(centavos: number): string {
  if (!centavos) return '0,00';
  const val = (centavos / 100).toFixed(2);
  const [inteiro, decimal] = val.split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${comPontos},${decimal}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para brasileiro (dd/mm/aaaa)
 */
export function formatarDataBR(dataISO?: string | null): string {
  if (!dataISO) return '-';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Nomes de meses em português abreviados e completos
 */
export const MESES_BR_ABREV = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

export const MESES_BR_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DIAS_SEMANA_BR = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Formata competência YYYY-MM para "jul/2026" ou "ref. 07/2026"
 */
export function formatarMesCompetencia(mesAno: string, modo: 'curto' | 'ref' = 'curto'): string {
  if (!mesAno) return '-';
  const [ano, mes] = mesAno.split('-');
  const idx = parseInt(mes, 10) - 1;
  if (modo === 'ref') {
    return `ref. ${mes.padStart(2, '0')}/${ano}`;
  }
  return `${MESES_BR_ABREV[idx] || mes}/${ano}`;
}

/**
 * Retorna mês atual em formato YYYY-MM
 */
export function getMesAtualISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}`;
}

/**
 * Retorna data atual em formato YYYY-MM-DD
 */
export function getDataHojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Mascarar CPF ou CNPJ
 */
export function mascararDocumento(doc?: string): string {
  if (!doc) return '-';
  const limpo = doc.replace(/\D/g, '');
  if (limpo.length === 11) {
    // CPF: 000.***.***-00
    return `${limpo.slice(0, 3)}.***.***-${limpo.slice(9)}`;
  }
  if (limpo.length === 14) {
    // CNPJ: 00.***.***/0001-00
    return `${limpo.slice(0, 2)}.***.***/${limpo.slice(8, 12)}-${limpo.slice(12)}`;
  }
  return doc.length > 4 ? `${doc.slice(0, 2)}****${doc.slice(-2)}` : '****';
}

/**
 * Mascarar Chave PIX
 */
export function mascararPix(pix?: string): string {
  if (!pix) return '-';
  if (pix.includes('@')) {
    const [user, domain] = pix.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (pix.length > 8) {
    return `${pix.slice(0, 3)}****${pix.slice(-3)}`;
  }
  return '******';
}

/**
 * Formata CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00
 */
export function formatarCpfCnpj(doc: string): string {
  const limpo = doc.replace(/\D/g, '');
  if (limpo.length <= 11) {
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return limpo
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata telefone brasileiro: (11) 99999-9999
 */
export function formatarTelefone(tel: string): string {
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length <= 10) {
    return limpo.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return limpo.slice(0, 11).replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

/**
 * Porcentagem formatada: 12,5%
 */
export function formatarPorcentagem(valor: number, casasDecimais: number = 1): string {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  })}%`;
}

export const formatarCNPJouCPF = formatarCpfCnpj;
