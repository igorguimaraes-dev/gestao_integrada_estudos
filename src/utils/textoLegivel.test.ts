import { describe, expect, it } from 'vitest';
import { normalizarTextoLegivel } from './textoLegivel';

describe('normalizarTextoLegivel', () => {
  it('restaura termos acentuados que chegaram com caractere substituto', () => {
    expect(normalizarTextoLegivel('Transação efetuada com o cart�o Nexus Demo')).toBe(
      'Transação efetuada com o cartão Nexus Demo',
    );
    expect(normalizarTextoLegivel('Taxa de emiss�o da nota fiscal de servi�o')).toBe(
      'Taxa de emissão da nota fiscal de serviço',
    );
    expect(normalizarTextoLegivel('Empresa Exemplo Ltda')).toBe(
      'Empresa Exemplo Ltda',
    );
    expect(normalizarTextoLegivel('Caio s� - Teste - [ Jur�dico ]')).toBe(
      'Caio só - Teste - [ Jurídico ]',
    );
    expect(normalizarTextoLegivel('S�rgio')).toBe('S�rgio');
  });
});
