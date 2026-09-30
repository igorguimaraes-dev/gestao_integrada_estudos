const correcoesComPerda: Array<[RegExp, string]> = [
  [/transa��o/gi, 'transação'],
  [/transa��es/gi, 'transações'],
  [/cobran�a/gi, 'cobrança'],
  [/notifica��o/gi, 'notificação'],
  [/gest�o/gi, 'gestão'],
  [/produ��o/gi, 'produção'],
  [/movimenta��o/gi, 'movimentação'],
  [/classifica��o/gi, 'classificação'],
  [/concilia��o/gi, 'conciliação'],
  [/sincroniza��o/gi, 'sincronização'],
  [/descri��o/gi, 'descrição'],
  [/d�bito/gi, 'débito'],
  [/cr�dito/gi, 'crédito'],
  [/n�o/gi, 'não'],
  [/tr�fego/gi, 'tráfego'],
  [/s�cio/gi, 'sócio'],
  [/cart�o/gi, 'cartão'],
  [/emiss�o/gi, 'emissão'],
  [/servi�os/gi, 'serviços'],
  [/servi�o/gi, 'serviço'],
  [/com�rcio/gi, 'comércio'],
  [/a�ougue/gi, 'açougue'],
  [/a�o/gi, 'aço'],
  [/jur�dico/gi, 'jurídico'],
  [/transfer�ncias/gi, 'transferências'],
  [/ve�culos/gi, 'veículos'],
  [/notifica��es/gi, 'notificações'],
  [/comunica��o/gi, 'comunicação'],
  [/tribut�rias/gi, 'tributárias'],
  [/cria��o/gi, 'criação'],
  [/banc�rias/gi, 'bancárias'],
  [/ver�ssimo/gi, 'veríssimo'],
  [/(?<!\p{L})s�(?!\p{L})/giu, 'só'],
];

function repararMojibakeSemPerda(texto: string): string {
  if (!/Ã[£§©ªº]|Â[\x80-\xBF]/.test(texto)) return texto;

  try {
    const bytes = Uint8Array.from([...texto].map((caractere) => caractere.charCodeAt(0)));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return texto;
  }
}

export function normalizarTextoLegivel(texto?: string): string {
  let resultado = repararMojibakeSemPerda(texto || '');

  for (const [padrao, substituicao] of correcoesComPerda) {
    resultado = resultado.replace(padrao, (ocorrencia) => {
      const inicialMaiuscula = ocorrencia[0] === ocorrencia[0].toUpperCase();
      return inicialMaiuscula
        ? substituicao[0].toUpperCase() + substituicao.slice(1)
        : substituicao;
    });
  }

  return resultado;
}
