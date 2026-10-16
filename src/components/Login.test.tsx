import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Login } from './Login';
describe('Login demonstrativo', () => {
  it('exibe as logos locais do Asaas e Autentique na apresentação', () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Asaas' })).toHaveAttribute('src', '/logos/asaas.svg');
    expect(screen.getByRole('img', { name: 'Autentique' })).toHaveAttribute('src', '/logos/autentique.svg');
    expect(screen.queryByText('Dados ficticios')).not.toBeInTheDocument();
    expect(screen.getByText(/Sem conexão com contas reais/)).toBeVisible();
  });
});
