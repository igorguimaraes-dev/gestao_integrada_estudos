export interface ItemFaturaPdf {
  id: string;
  data: string;
  descricao: string;
  valorCents: number;
  selecionado: boolean;
}

const valorParaCents = (valor: string): number | null => {
  const normalizado = valor.replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.').trim();
  const numero = Number(normalizado);
  return Number.isFinite(numero) && numero !== 0 ? Math.round(Math.abs(numero) * 100) : null;
};

const dataParaIso = (valor: string, anoPadrao: number): string | null => {
  const partes = valor.split('/').map(Number);
  if (partes.length < 2 || partes.some(Number.isNaN)) return null;
  const [dia, mes, anoInformado] = partes;
  const ano = anoInformado ? (anoInformado < 100 ? 2000 + anoInformado : anoInformado) : anoPadrao;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
};

const linhasDoPdf = async (file: File): Promise<string[]> => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const documento = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const linhas: string[] = [];

  for (let paginaNumero = 1; paginaNumero <= documento.numPages; paginaNumero += 1) {
    const pagina = await documento.getPage(paginaNumero);
    const conteudo = await pagina.getTextContent();
    const porLinha = new Map<number, string[]>();
    for (const item of conteudo.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const coordenadaY = 'transform' in item ? Math.round(item.transform[5]) : linhas.length;
      porLinha.set(coordenadaY, [...(porLinha.get(coordenadaY) || []), item.str]);
    }
    linhas.push(...[...porLinha.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, itens]) => itens.join(' ').replace(/\s+/g, ' ').trim()));
  }
  await documento.cleanup();
  return linhas;
};

/**
 * Extrai linhas comuns de faturas brasileiras. A confirmação humana no modal
 * é obrigatória porque cada emissor formata o PDF de uma forma diferente.
 */
export async function extrairItensFaturaPdf(file: File, anoPadrao: number): Promise<ItemFaturaPdf[]> {
  const linhas = await linhasDoPdf(file);
  const itens: ItemFaturaPdf[] = [];
  const padrao = /^\s*(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?(?:R\$\s*)?[\d.]+,\d{2})\s*$/i;
  const ignorar = /\b(total|subtotal|pagamento|saldo anterior|limite|encargos|iof|anuidade)\b/i;

  for (const linha of linhas) {
    const encontrado = linha.match(padrao);
    if (!encontrado || ignorar.test(encontrado[2])) continue;
    const data = dataParaIso(encontrado[1], anoPadrao);
    const valorCents = valorParaCents(encontrado[3]);
    if (!data || !valorCents) continue;
    itens.push({
      id: `pdf-${itens.length}-${data}-${valorCents}`,
      data,
      descricao: encontrado[2].trim(),
      valorCents,
      selecionado: true,
    });
  }
  return itens;
}
