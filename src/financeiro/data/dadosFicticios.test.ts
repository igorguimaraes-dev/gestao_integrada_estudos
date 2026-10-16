import { describe, expect, it } from 'vitest';
import { gerarDadosFicticios } from './dadosFicticios';
import { initialClients, initialAsaasCharges } from '../../mockData';

describe('dados da entrevista', () => {
  it('usa contatos reservados e documentos sem valor real', () => {
    const dados = gerarDadosFicticios();
    for (const cliente of dados.clientes) {
      expect(cliente.email).toMatch(/@example\.com$/);
      expect(cliente.cnpjCpf).toBe('00.000.000/0000-00');
      expect(cliente.telefone).toBe('(00) 00000-0000');
    }
    for (const fornecedor of dados.fornecedores) {
      expect(fornecedor.chavePix).toMatch(/@example\.com$/);
      if (fornecedor.agencia) expect(fornecedor.agencia).toBe('0000');
      if (fornecedor.conta) expect(fornecedor.conta).toBe('00000-0');
    }
    expect(initialClients.every(c => c.contactEmail.endsWith('@example.com'))).toBe(true);
    expect(initialAsaasCharges.every(c => !c.pixCopiaECola || c.pixCopiaECola.startsWith('DEMO-'))).toBe(true);
    expect(initialAsaasCharges.every(c => !c.bankSlipCode || c.bankSlipCode.startsWith('DEMO-'))).toBe(true);
  });

  it('preenche o mês atual e mantém referências válidas nas transações', () => {
    const dados = gerarDadosFicticios();
    const hoje = new Date();
    const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    expect(dados.lancamentos.some(l => l.mesCompetencia === mes && l.tipo === 'receita')).toBe(true);
    for (const item of dados.lancamentos) {
      if (item.contaBancariaId) expect(dados.contas.some(c => c.id === item.contaBancariaId)).toBe(true);
      if (item.clienteId) expect(dados.clientes.some(c => c.id === item.clienteId)).toBe(true);
    }
  });
});
