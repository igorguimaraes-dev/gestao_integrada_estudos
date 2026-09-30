import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Login } from './Login';

describe('Login', () => {
  it('displays official Asaas and Autentique logos in the integrations showcase', () => {
    render(<Login onLogin={vi.fn()} />);

    expect(screen.getByLabelText('Asaas')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Autentique' })).toHaveAttribute(
      'src',
      '/logos/autentique.svg',
    );
  });
});
