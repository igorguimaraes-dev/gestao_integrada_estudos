import { describe, expect, it } from 'vitest';
import { criarSnapshotDemonstracao, statusIntegracaoDemonstracao } from './asaasDemo';

describe('integração demonstrativa de cobranças', () => {
  it('fornece uma empresa e lançamentos fictícios prontos para sincronização', () => {
    const snapshot = criarSnapshotDemonstracao();

    expect(snapshot).toMatchObject({
      balance: 18450.75,
      customers: expect.arrayContaining([
        expect.objectContaining({
          id: 'demo-cliente-aurora',
          name: 'Aurora Design Ltda.',
          email: 'financeiro@auroradesign.exemplo',
        }),
      ]),
      payments: expect.arrayContaining([
        expect.objectContaining({
          id: 'demo-cobranca-001',
          customer: 'demo-cliente-aurora',
          value: 2450,
          status: 'RECEIVED',
        }),
      ]),
      financialTransactions: expect.arrayContaining([
        expect.objectContaining({
          id: 'demo-transacao-001',
          type: 'CREDIT',
          value: 2450,
        }),
      ]),
    });
  });

  it('informa que a integração é local e não exige credenciais', () => {
    expect(statusIntegracaoDemonstracao()).toEqual({
      configured: true,
      environment: 'demonstration',
      baseUrl: null,
      persistent: false,
      generalStatus: 'Dados fictícios locais',
    });
  });
});
