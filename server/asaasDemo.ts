export interface SnapshotDemonstracao {
  customers: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  balance: number;
  financialTransactions: Array<Record<string, unknown>>;
  syncedAt: string;
}

export function statusIntegracaoDemonstracao() {
  return {
    configured: true,
    environment: 'demonstration' as const,
    baseUrl: null,
    persistent: false,
    generalStatus: 'Dados fictícios locais',
  };
}

export function criarSnapshotDemonstracao(): SnapshotDemonstracao {
  return {
    customers: [
      {
        id: 'demo-cliente-aurora',
        name: 'Aurora Design Ltda.',
        company: 'Aurora Design',
        cpfCnpj: '12.345.678/0001-90',
        email: 'financeiro@auroradesign.exemplo',
        mobilePhone: '(11) 99999-0001',
        dateCreated: '2026-09-01',
        deleted: false,
      },
      {
        id: 'demo-cliente-horizonte',
        name: 'Horizonte Consultoria ME',
        company: 'Horizonte Consultoria',
        cpfCnpj: '98.765.432/0001-10',
        email: 'contato@horizonte.exemplo',
        mobilePhone: '(21) 98888-0002',
        dateCreated: '2026-09-03',
        deleted: false,
      },
    ],
    payments: [
      {
        id: 'demo-cobranca-001',
        customer: 'demo-cliente-aurora',
        value: 2450,
        status: 'RECEIVED',
        billingType: 'PIX',
        description: 'Projeto de identidade visual — Aurora Design',
        dueDate: '2026-09-10',
        paymentDate: '2026-09-10',
        invoiceNumber: 'DEMO-001',
      },
      {
        id: 'demo-cobranca-002',
        customer: 'demo-cliente-horizonte',
        value: 1800,
        status: 'PENDING',
        billingType: 'BOLETO',
        description: 'Consultoria estratégica — Horizonte',
        dueDate: '2026-10-05',
        invoiceNumber: 'DEMO-002',
      },
    ],
    balance: 18450.75,
    financialTransactions: [
      {
        id: 'demo-transacao-001',
        type: 'CREDIT',
        value: 2450,
        description: 'Recebimento de demonstração — Aurora Design',
        date: '2026-09-10',
        paymentId: 'demo-cobranca-001',
      },
      {
        id: 'demo-transacao-002',
        type: 'DEBIT',
        value: 320.5,
        description: 'Despesa operacional de demonstração',
        date: '2026-09-12',
      },
    ],
    syncedAt: new Date().toISOString(),
  };
}
