import { describe, expect, it } from 'vitest';
import { normalizarTextoLegivel } from './textoLegivel';

describe('normalizarTextoLegivel', () => {
  it('restaura termos acentuados que chegaram com caractere substituto', () => {
    expect(normalizarTextoLegivel('Transação efetuada com o cart�o Dubbo Marketing')).toBe(
      'Transação efetuada com o cartão Dubbo Marketing',
    );
    expect(normalizarTextoLegivel('Taxa de emiss�o da nota fiscal de servi�o')).toBe(
      'Taxa de emissão da nota fiscal de serviço',
    );
    expect(normalizarTextoLegivel('HC Com�rcio de Perfilados e A�o LTDA')).toBe(
      'HC Comércio de Perfilados e Aço LTDA',
    );
    expect(normalizarTextoLegivel('Caio s� - Teste - [ Jur�dico ]')).toBe(
      'Caio só - Teste - [ Jurídico ]',
    );
    expect(normalizarTextoLegivel('S�rgio')).toBe('S�rgio');
  });
});
