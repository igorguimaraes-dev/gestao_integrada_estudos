import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DATABASE_STORAGE_KEYS as KEYS, StorageService } from './storage';

describe('ambiente de apresentacao', () => {
  beforeEach(() => localStorage.clear());
  it('substitui dados antigos por uma demonstracao completa', () => {
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify([{ id: 'cliente-real' }]));
    localStorage.setItem(KEYS.DATA_MODE, 'asaas-production');
    localStorage.setItem('agencia_financeiro_lancamentos', 'dados antigos');
    StorageService.inicializarDemonstracao();
    expect(StorageService.getClientES().length).toBeGreaterThan(0);
    expect(StorageService.getClientES().some(c => c.id === 'cliente-real')).toBe(false);
    expect(StorageService.getFornecedores().length).toBeGreaterThan(0);
    expect(StorageService.getLancamentos().length).toBeGreaterThan(0);
    expect(StorageService.getExtratoTransacoes().length).toBeGreaterThan(0);
    expect(localStorage.getItem('agencia_financeiro_lancamentos')).toBeNull();
  });
  it('preserva edicoes da apresentacao sem recuperar dados remotos', async () => {
    StorageService.inicializarDemonstracao();
    const cliente = StorageService.getClientES()[0];
    StorageService.saveCliente({ ...cliente, nomeRazaoSocial: 'Cliente editado' });
    StorageService.inicializarDemonstracao();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await StorageService.hidratarDoBanco();
    await StorageService.sincronizarComBanco();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(StorageService.getClientES()[0].nomeRazaoSocial).toBe('Cliente editado');
    vi.unstubAllGlobals();
  });

  it('oferece movimentos pendentes conciliáveis e vínculos consistentes', () => {
    StorageService.carregarDadosFicticios();
    const extrato = StorageService.getExtratoTransacoes();
    expect(extrato.some(item => !item.conciliado)).toBe(true);
    expect(extrato.some(item => item.conciliado)).toBe(true);
    for (const item of extrato) {
      expect(Boolean(item.lancamentoIdVinculado)).toBe(item.conciliado);
      const id = item.id.replace('demo-extrato-', '');
      expect(StorageService.getLancamentos().find(l => l.id === id)?.conciliado).toBe(item.conciliado);
    }
  });
});
