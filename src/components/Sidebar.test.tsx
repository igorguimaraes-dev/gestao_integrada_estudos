import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('inicia a seção Principal recolhida e a abre pelo seu botão', async () => {
    const user = userEvent.setup();

    render(<Sidebar currentRoute="dashboard" onNavigate={() => undefined} />);

    const toggle = screen.getByRole('button', { name: 'Expandir seção Principal' });
    expect(screen.queryByRole('button', { name: 'Início' })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Início' })).toBeInTheDocument();
  });

  it('não mostra atalhos em construção após recolher uma seção Principal aberta', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sidebar currentRoute="dashboard" onNavigate={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Expandir seção Principal' }));
    expect(screen.getAllByTitle('Em construção')).not.toHaveLength(0);

    rerender(<Sidebar collapsed currentRoute="dashboard" onNavigate={() => undefined} />);

    expect(screen.queryAllByTitle('Em construção')).toHaveLength(0);
  });

  it('hides all submenu shortcuts after collapsing sections that were open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sidebar currentRoute="dashboard" onNavigate={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Expandir seção Principal' }));
    await user.click(screen.getByRole('button', { name: 'Expandir seção Financeiro' }));
    await user.click(screen.getByRole('button', { name: 'Expandir seção Configurações' }));

    rerender(<Sidebar collapsed currentRoute="dashboard" onNavigate={() => undefined} />);

    expect(screen.queryByRole('button', { name: 'Início' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fluxo de Caixa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Integrações' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir seção Principal' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir seção Financeiro' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir seção Configurações' })).toBeVisible();
  });

  it('oculta a barra de rolagem nativa no modo recolhido', () => {
    render(<Sidebar collapsed currentRoute="dashboard" onNavigate={() => undefined} />);

    expect(screen.getByRole('navigation')).toHaveClass('[scrollbar-width:none]');
  });

  it('inicia a seção Financeiro recolhida e a abre pelo seu botão', async () => {
    const user = userEvent.setup();

    render(<Sidebar currentRoute="financeiro" onNavigate={() => undefined} />);

    const toggle = screen.getByRole('button', { name: 'Expandir seção Financeiro' });
    expect(screen.queryByRole('button', { name: 'Fluxo de Caixa' })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Fluxo de Caixa' })).toBeInTheDocument();
  });

  it('inicia a seção Configurações recolhida e a abre pelo seu botão', async () => {
    const user = userEvent.setup();

    render(<Sidebar currentRoute="configuracoes" onNavigate={() => undefined} />);

    const toggle = screen.getByRole('button', { name: 'Expandir seção Configurações' });
    expect(screen.queryByRole('button', { name: 'Integrações' })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Integrações' })).toBeInTheDocument();
  });

  it('abre um submenu flutuante sem expandir a barra estreita', async () => {
    const user = userEvent.setup();
    const navigatedRoutes: string[] = [];

    render(
      <Sidebar
        collapsed
        currentRoute="financeiro"
        onNavigate={(route) => { navigatedRoutes.push(route); }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Abrir seção Principal' })).toBeInTheDocument();
    const financialShortcut = screen.getByRole('button', { name: 'Abrir seção Financeiro' });
    expect(financialShortcut).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir seção Configurações' })).toBeInTheDocument();

    await user.click(financialShortcut);

    expect(screen.getByRole('navigation', { name: 'Menu Financeiro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fluxo de Caixa' }));

    expect(navigatedRoutes).toEqual(['financeiro-fluxo-caixa']);
    expect(screen.queryByRole('navigation', { name: 'Menu Financeiro' })).not.toBeInTheDocument();
  });

  it('eleva a camada da lateral enquanto o submenu está aberto', async () => {
    const user = userEvent.setup();

    render(<Sidebar collapsed currentRoute="dashboard" onNavigate={() => undefined} />);

    await user.click(screen.getByRole('button', { name: 'Abrir seção Principal' }));

    expect(document.getElementById('main-sidebar')).toHaveClass('z-40');
  });

  it('identifica visualmente os grupos no modo recolhido', () => {
    render(<Sidebar collapsed currentRoute="dashboard" onNavigate={() => undefined} />);

    expect(screen.getByRole('tooltip', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('tooltip', { name: 'Financeiro' })).toBeInTheDocument();
    expect(screen.getByRole('tooltip', { name: 'Configurações' })).toBeInTheDocument();
  });
});
