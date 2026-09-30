import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PeriodFilterBar } from './components/common/PeriodFilterBar';
import { NovoLancamentoModal } from './components/lancamentos/NovoLancamentoModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ScopeDialog } from './components/common/ScopeDialog';
import { ToastContainer } from './components/common/Toast';
import { DashboardView } from './views/DashboardView';
import { LancamentosView } from './views/LancamentosView';
import { OrcadoRealizadoView } from './views/OrcadoRealizadoView';
import { FluxoCaixaView } from './views/FluxoCaixaView';
import { ConciliacaoView } from './views/ConciliacaoView';
import { CartoesView } from './views/CartoesView';
import { SimuladorView } from './views/SimuladorView';
import { ClientesView } from './views/ClientesView';
import { FornecedoresView } from './views/FornecedoresView';
import { ReembolsosView } from './views/ReembolsosView';
import { RelatoriosView } from './views/RelatoriosView';
import { ImportacaoView } from './views/ImportacaoView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { CategoriasView } from './views/CategoriasView';
import { definirOcultacaoDeValores } from './utils/formatters';

interface EmbeddedFinanceiroProps {
  initialTab: string;
  hideValues: boolean;
}

const FinanceiroContent: React.FC = () => {
  const { activeTab, toasts, removeToast } = useApp();

  const renderView = () => {
    switch (activeTab) {
      case 'lancamentos': return <LancamentosView />;
      case 'orcado_realizado': return <OrcadoRealizadoView />;
      case 'fluxo_caixa': return <FluxoCaixaView />;
      case 'conciliacao': return <ConciliacaoView />;
      case 'cartoes': return <CartoesView />;
      case 'simulador': return <SimuladorView />;
      case 'clientes': return <ClientesView />;
      case 'fornecedores': return <FornecedoresView />;
      case 'reembolsos': return <ReembolsosView />;
      case 'relatorios': return <RelatoriosView />;
      case 'importacao': return <ImportacaoView />;
      case 'configuracoes': return <ConfiguracoesView />;
      case 'categorias': return <CategoriasView />;
      default: return <DashboardView />;
    }
  };

  const ocultarBarraPeriodo = ['configuracoes', 'importacao', 'fornecedores', 'categorias'].includes(activeTab);

  return (
    <section className="space-y-6 pb-8">
      {!ocultarBarraPeriodo && (
        <div className="rounded-[var(--radius-card)] border border-borda bg-superficie p-2 shadow-sutil dark:border-borda-dark dark:bg-navy">
          <PeriodFilterBar />
        </div>
      )}
      {renderView()}
      <NovoLancamentoModal />
      <ConfirmDialog />
      <ScopeDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </section>
  );
};

export default function EmbeddedFinanceiro({ initialTab, hideValues }: EmbeddedFinanceiroProps) {
  definirOcultacaoDeValores(hideValues);

  return (
    <AppProvider initialTab={initialTab}>
      <FinanceiroContent />
    </AppProvider>
  );
}
