import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PeriodFilterBar } from './components/common/PeriodFilterBar';
import { NovoLancamentoModal } from './components/lancamentos/NovoLancamentoModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ScopeDialog } from './components/common/ScopeDialog';
import { ToastContainer } from './components/common/Toast';

// Módulos / Telas da Aplicação
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

const AppContent: React.FC = () => {
  const { activeTab, toasts, removeToast } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Renderizador dinâmico de abas
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'lancamentos':
        return <LancamentosView />;
      case 'orcado_realizado':
        return <OrcadoRealizadoView />;
      case 'fluxo_caixa':
        return <FluxoCaixaView />;
      case 'conciliacao':
        return <ConciliacaoView />;
      case 'cartoes':
        return <CartoesView />;
      case 'simulador':
        return <SimuladorView />;
      case 'clientes':
        return <ClientesView />;
      case 'fornecedores':
        return <FornecedoresView />;
      case 'reembolsos':
        return <ReembolsosView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'importacao':
        return <ImportacaoView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      case 'categorias':
        return <CategoriasView />;
      default:
        return <DashboardView />;
    }
  };

  // Algumas abas não precisam da barra de período global fixa no topo (ex: configurações, importação)
  const ocultarBarraPeriodo = ['configuracoes', 'importacao', 'fornecedores', 'categorias'].includes(activeTab);

  return (
    <div className="flex h-screen overflow-hidden bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark font-sans">
      {/* Menu Lateral de Navegação */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar com Saldo Consolidado, Tema e Atalho + Novo lançamento */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Barra de filtros globais (mês, trimestre, ano ou período personalizado) */}
        {!ocultarBarraPeriodo && (
          <div className="bg-superficie dark:bg-navy border-b border-borda dark:border-borda-dark px-4 sm:px-6 py-2.5 shrink-0 shadow-sutil">
            <PeriodFilterBar />
          </div>
        )}

        {/* Área de Visualização com Scroll Independente */}
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {/* Modais e Diálogos Globais */}
      <NovoLancamentoModal />
      <ConfirmDialog />
      <ScopeDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

interface FinanceiroAppProps {
  initialTab?: string;
}

export default function App({ initialTab = 'dashboard' }: FinanceiroAppProps) {
  return (
    <AppProvider initialTab={initialTab}>
      <AppContent />
    </AppProvider>
  );
}
