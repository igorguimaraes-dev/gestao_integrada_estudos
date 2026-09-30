import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncAsaasToFinance } from './asaasSync';
import { DATABASE_STORAGE_KEYS, StorageService } from './storage';

describe('syncAsaasToFinance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persiste descrições importadas do Asaas com caracteres legíveis', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        balance: 0,
        customers: [],
        payments: [{
          id: 'pagamento-1',
          status: 'RECEIVED',
          billingType: 'PIX',
          dueDate: '2026-09-01',
          value: 15,
          description: 'TransaÃ§Ã£o via Pix',
        }],
        financialTransactions: [{
          id: 'movimento-1',
          date: '2026-09-01',
          value: -0.55,
          type: 'FEE',
          description: 'Taxa de notifica��o por WhatsApp',
        }],
      }),
    }));

    await syncAsaasToFinance();

    expect(StorageService.getLancamentos()).toEqual(expect.arrayContaining([
      expect.objectContaining({ descricao: 'Transação via Pix' }),
      expect.objectContaining({ descricao: 'Taxa de notificação por WhatsApp' }),
    ]));
    expect(StorageService.getExtratoTransacoes()).toEqual(expect.arrayContaining([
      expect.objectContaining({ descricao: 'Taxa de notificação por WhatsApp' }),
    ]));
  });

  it('normaliza descrições corrompidas que já estavam salvas no navegador', () => {
    localStorage.setItem(DATABASE_STORAGE_KEYS.LANCAMENTOS, JSON.stringify([
      { id: 'lancamento-antigo', descricao: 'Gest�o de Branding e Fluxo CRM' },
    ]));

    expect(StorageService.getLancamentos()).toEqual([
      expect.objectContaining({ descricao: 'Gestão de Branding e Fluxo CRM' }),
    ]);
    expect(JSON.parse(localStorage.getItem(DATABASE_STORAGE_KEYS.LANCAMENTOS) || '[]')).toEqual([
      expect.objectContaining({ descricao: 'Gestão de Branding e Fluxo CRM' }),
    ]);
  });
});
