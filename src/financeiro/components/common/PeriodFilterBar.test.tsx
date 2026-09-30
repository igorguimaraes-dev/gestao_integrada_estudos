import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PeriodFilterBar } from './PeriodFilterBar';

describe('PeriodFilterBar', () => {
  it('does not expose a control to switch the financial regime', () => {
    render(
      <AppProvider>
        <PeriodFilterBar />
      </AppProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Regime Caixa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Regime Competência' })).not.toBeInTheDocument();
  });
});
