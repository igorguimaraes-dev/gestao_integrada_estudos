import { afterEach, describe, expect, it } from 'vitest';
import { definirOcultacaoDeValores, formatarMoeda } from './formatters';

describe('formatarMoeda', () => {
  afterEach(() => definirOcultacaoDeValores(false));

  it('masks and restores amounts when privacy mode changes', () => {
    definirOcultacaoDeValores(false);
    expect(formatarMoeda(123456)).toBe('R$ 1.234,56');

    definirOcultacaoDeValores(true);
    expect(formatarMoeda(123456)).toBe('R$ ••••••');

    definirOcultacaoDeValores(false);
    expect(formatarMoeda(123456)).toBe('R$ 1.234,56');
  });
});
