import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mesclarPrestadoresImportados } from '../data/prestadoresImportados';
import { DATABASE_STORAGE_KEYS, StorageService } from './storage';

describe('StorageService.hidratarDoBanco', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normaliza todo o estado remoto antes de gravá-lo no navegador', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        state: {
          [DATABASE_STORAGE_KEYS.CATEGORIAS]: [{ id: 'categoria-1', nome: 'Emiss�o de notas fiscais' }],
          [DATABASE_STORAGE_KEYS.CLIENTES]: [{ id: 'cliente-1', nomeRazaoSocial: 'HC Com�rcio de Perfilados e A�o LTDA' }],
          [DATABASE_STORAGE_KEYS.LANCAMENTOS]: [{
            id: 'lancamento-1',
            descricao: 'Transação efetuada com o cart�o Dubbo Marketing',
          }],
          [DATABASE_STORAGE_KEYS.FORNECEDORES]: mesclarPrestadoresImportados([]),
        },
      }),
    }));

    await StorageService.hidratarDoBanco();

    expect(JSON.parse(localStorage.getItem(DATABASE_STORAGE_KEYS.CATEGORIAS) || '[]')).toEqual([
      expect.objectContaining({ nome: 'Emissão de notas fiscais' }),
    ]);
    expect(JSON.parse(localStorage.getItem(DATABASE_STORAGE_KEYS.CLIENTES) || '[]')).toEqual([
      expect.objectContaining({ nomeRazaoSocial: 'HC Comércio de Perfilados e Aço LTDA' }),
    ]);
    expect(JSON.parse(localStorage.getItem(DATABASE_STORAGE_KEYS.LANCAMENTOS) || '[]')).toEqual([
      expect.objectContaining({ descricao: 'Transação efetuada com o cartão Dubbo Marketing' }),
    ]);

    const chamadasFetch = vi.mocked(fetch).mock.calls;
    expect(chamadasFetch).toHaveLength(2);
    const [, opcoesDaSincronizacao] = chamadasFetch[1];
    expect(opcoesDaSincronizacao).toMatchObject({ method: 'PUT' });
    expect(JSON.parse(String(opcoesDaSincronizacao?.body))).toMatchObject({
      state: {
        [DATABASE_STORAGE_KEYS.LANCAMENTOS]: [
          expect.objectContaining({ descricao: 'Transação efetuada com o cartão Dubbo Marketing' }),
        ],
      },
    });
  });
});
