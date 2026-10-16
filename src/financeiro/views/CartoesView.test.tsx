import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { CartoesView } from './CartoesView';

describe('Cartões da apresentação', () => {
  it('exibe as despesas fictícias de cartão sem exigir um PDF real', () => {
    StorageService.carregarDadosFicticios();
    const despesa = StorageService.getLancamentos().find(l => l.cartaoCreditoId && l.mesCompetencia === new Date().toISOString().slice(0, 7));
    expect(despesa).toBeDefined();
    render(<AppProvider><CartoesView /></AppProvider>);
    expect(screen.getByText(despesa!.descricao)).toBeVisible();
  });
});
