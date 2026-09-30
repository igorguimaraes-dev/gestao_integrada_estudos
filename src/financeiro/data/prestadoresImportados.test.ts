import { describe, expect, it } from 'vitest';
import { mesclarPrestadoresImportados } from './prestadoresImportados';
import { Fornecedor } from '../types';

describe('mesclarPrestadoresImportados', () => {
  it('adds the 14 supplied providers without overwriting an existing provider with the same PIX key', () => {
    const marlonEditado: Fornecedor = {
      id: 'fornecedor-manual-marlon',
      nome: 'Marlon Carvalho atualizado',
      chavePix: '00014636772784',
      banco: 'Banco informado manualmente',
      ativo: true,
      status: 'ativo',
      valorPadrao: 999999,
    };

    const resultado = mesclarPrestadoresImportados([marlonEditado]);

    expect(resultado).toHaveLength(14);
    expect(resultado.find((fornecedor) => fornecedor.chavePix === '00014636772784')).toEqual(marlonEditado);
    expect(resultado).toContainEqual(expect.objectContaining({
      nome: 'Helton Chaves',
      chavePix: '58901632000106',
      tipoChavePix: 'cnpj',
      ativo: true,
      valorPadrao: 100000,
    }));
    expect(resultado).toContainEqual(expect.objectContaining({
      nome: 'Tainara Mallet (SEO)',
      chavePix: '45618769000106',
      ativo: false,
      valorPadrao: 32000,
    }));
  });
});
