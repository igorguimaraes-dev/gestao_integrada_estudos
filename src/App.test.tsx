import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';

describe('App', () => {
  it('renders the access screen before showing business data', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.queryByText('Fluxo de caixa')).not.toBeInTheDocument();
  });

  it('opens the local dashboard after the login form is submitted', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.type(screen.getByLabelText('E-mail'), 'admin@empresa.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar no sistema' }));
    await user.click(screen.getByRole('button', { name: 'Expandir seção Financeiro' }));

    expect(screen.getByRole('button', { name: 'Fluxo de Caixa' })).toBeInTheDocument();
  });

});
