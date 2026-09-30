import React, { useState, useEffect } from 'react';
import {
  RouteId,
  Client,
  Contract,
  ReceivableItem,
  PipelineDeal,
  ActionItem,
  ToastMessage,
  AsaasChargeItem,
  ServiceInvoice,
} from './types';
import {
  initialClients,
  initialContracts,
  initialReceivables,
  initialPayables,
  initialActionItems,
  initialDeals,
  initialIntegrations,
  initialAsaasCharges,
  initialServiceInvoices,
} from './mockData';

// Layout components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastContainer } from './components/Toast';
import { CommandMenu } from './components/CommandMenu';
import { QuickCreateModal } from './components/QuickCreateModal';

// Views
import { DashboardView } from './views/DashboardView';
import { CentralDoDiaView } from './views/CentralDoDiaView';
import { ClientesView } from './views/ClientesView';
import { ClienteDetalheView } from './views/ClienteDetalheView';
import { ConciliacaoBancariaView } from './views/ConciliacaoBancariaView';
import { AsaasNotasECobrancasView } from './views/AsaasNotasECobrancasView';
import { PipelineView } from './views/PipelineView';
import { IntegracoesView } from './views/IntegracoesView';
import { RelatoriosView } from './views/RelatoriosView';
import { AutomacoesView } from './views/AutomacoesView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { InadimplentesDashboard } from './views/InadimplentesDashboard';
import EmbeddedFinanceiro from './financeiro/EmbeddedFinanceiro';
import { syncAsaasToFinance } from './financeiro/services/asaasSync';
import { Login } from './components/Login';

const financialRouteTabs: Partial<Record<RouteId, string>> = {
  financeiro: 'dashboard',
  'financeiro-lancamentos': 'lancamentos',
  'financeiro-orcado-realizado': 'orcado_realizado',
  'financeiro-fluxo-caixa': 'fluxo_caixa',
  'financeiro-conciliacao': 'conciliacao',
  'financeiro-cartoes': 'cartoes',
  'financeiro-simulador': 'simulador',
  'financeiro-equipe': 'fornecedores',
  'financeiro-reembolsos': 'reembolsos',
  'financeiro-relatorios': 'relatorios',
  'financeiro-importacao': 'importacao',
  'financeiro-configuracoes': 'configuracoes',
  'financeiro-categorias': 'categorias',
};

const routePaths: Partial<Record<RouteId, string>> = {
  dashboard: '/inicio',
  acoes: '/agenda',
  pipeline: '/pipeline',
  clientes: '/clientes',
  'cliente-detalhe': '/clientes/detalhe',
  inadimplentes: '/inadimplencia',
  contratos: '/contratos',
  'contrato-detalhe': '/contratos/detalhe',
  financeiro: '/dashboard',
  'financeiro-lancamentos': '/lancamentos',
  'financeiro-orcado-realizado': '/orcado-realizado',
  'financeiro-fluxo-caixa': '/fluxo-de-caixa',
  'financeiro-conciliacao': '/conciliacao-extrato',
  'financeiro-cartoes': '/cartoes-de-credito',
  'financeiro-simulador': '/simulador',
  'financeiro-equipe': '/equipe-prestadores',
  'financeiro-reembolsos': '/reembolsos',
  'financeiro-relatorios': '/relatorios',
  'financeiro-importacao': '/importacao-de-dados',
  'financeiro-configuracoes': '/financeiro/configuracoes',
  'financeiro-categorias': '/categorias-financeiras',
  'financeiro-receber': '/contas-a-receber',
  'financeiro-pagar': '/contas-a-pagar',
  conciliacao: '/conciliacao-extrato',
  'assistente-ia': '/copiloto-ia',
  'notas-cobrancas': '/notas-cobrancas',
  relatorios: '/relatorios-gerais',
  automacoes: '/automacoes',
  integracoes: '/integracoes',
  'integracao-detalhe': '/integracoes/detalhe',
  configuracoes: '/configuracoes',
};

const routeByPath = Object.entries(routePaths).reduce((map, [route, path]) => {
  map[path] = route as RouteId;
  return map;
}, {} as Record<string, RouteId>);

const normalizarPathname = (pathname: string) => {
  const normalizado = pathname.replace(/\/+$/, '') || '/';
  return normalizado.toLowerCase();
};

const routeFromLocation = (): RouteId => routeByPath[normalizarPathname(window.location.pathname)] || 'financeiro';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Navigation & View State
  const [currentRoute, setCurrentRoute] = useState<RouteId>(routeFromLocation);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Layout & UI State
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [quickCreateType, setQuickCreateType] = useState<
    'cliente' | 'proposta' | 'contrato' | 'cobranca' | 'despesa' | 'tarefa'
  >('cobranca');

  // Business Data Collections (stateful)
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [receivables, setReceivables] = useState<ReceivableItem[]>(initialReceivables);
  const [payables, setPayables] = useState(initialPayables);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>(initialDeals);
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [asaasCharges, setAsaasCharges] = useState<AsaasChargeItem[]>(initialAsaasCharges);
  const [serviceInvoices, setServiceInvoices] = useState<ServiceInvoice[]>(initialServiceInvoices);
  const [isAsaasSyncing, setIsAsaasSyncing] = useState(false);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut for Command Menu (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mantém a tela e a URL sincronizadas, inclusive nos botões voltar/avançar do navegador.
  useEffect(() => {
    const onPopState = () => setCurrentRoute(routeFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const destino = routePaths[currentRoute] || '/dashboard';
    if (normalizarPathname(window.location.pathname) !== destino) {
      window.history.pushState({ route: currentRoute }, '', destino);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (
      currentRoute === 'financeiro-clientes-contratos'
      || currentRoute === 'financeiro-pagar'
      || currentRoute === 'financeiro-receber'
      || currentRoute === 'contratos'
      || currentRoute === 'contrato-detalhe'
    ) {
      setCurrentRoute('financeiro');
    }
  }, [currentRoute]);

  // Quick Create Modal Opener
  const handleOpenQuickCreate = (type: string) => {
    setQuickCreateType(type as any);
    setIsQuickCreateOpen(true);
  };

  // Modal form submit handlers
  const handleSaveQuickCreate = (type: string, data: any) => {
    if (type === 'cliente') {
      const newClient: Client = {
        id: `cli_${Date.now()}`,
        name: data.name || 'Novo Cliente',
        document: data.document || '00.000.000/0001-00',
        segment: data.segment || 'Serviços',
        contactName: data.contactName || 'Contato Principal',
        contactEmail: data.contactEmail || 'contato@empresa.com',
        contactPhone: data.contactPhone || '(11) 99999-9999',
        responsible: 'Marlon Ribeiro',
        services: ['Gestão de Tráfego'],
        financialStatus: 'em_dia',
        healthScore: 'saudavel',
        monthlyRevenue: 5000,
        openBalance: 0,
        lastActivity: 'Cadastrado agora',
        createdAt: '05/09/2026',
        city: 'São Paulo',
        state: 'SP',
        activeContractsCount: 0,
        avatarColor: 'bg-primaria',
      };
      setClients((prev) => [newClient, ...prev]);
      addToast('Cliente criado com sucesso!', `${newClient.name} foi adicionado à carteira.`);
    } else if (type === 'contrato') {
      const newContract: Contract = {
        id: `ctr_${Date.now()}`,
        code: `CTR-${Math.floor(100 + Math.random() * 900)}`,
        clientId: data.clientId || clients[0].id,
        clientName: clients.find((c) => c.id === data.clientId)?.name || clients[0].name,
        title: data.title || 'Contrato de Prestação de Serviços',
        service: data.service || 'Gestão de Tráfego',
        value: Number(data.value) || 4500,
        billingCycle: 'mensal',
        dueDay: Number(data.dueDay) || 10,
        startDate: '01/09/2026',
        endDate: '01/09/2027',
        status: 'ativo',
        asaasStatus: 'sincronizado',
        reajusteIndex: 'IPCA',
        responsible: 'Marlon Ribeiro',
        progressStep: 5,
      };
      setContracts((prev) => [newContract, ...prev]);
      addToast('Contrato gerado com sucesso!', 'Contrato cadastrado e cobrança Asaas pronta para configurar.');
    } else if (type === 'cobranca') {
      const newRec: ReceivableItem = {
        id: `rec_${Date.now()}`,
        clientId: data.clientId || clients[0].id,
        clientName: clients.find((c) => c.id === data.clientId)?.name || clients[0].name,
        contractCode: 'CTR-NOVO',
        description: data.description || 'Honorários Mensais',
        dueDate: data.dueDate || '15/09/2026',
        amount: Number(data.amount) || 3500,
        method: data.method || 'pix',
        status: 'pendente',
        invoiceStatus: 'pendente',
        sentNotification: false,
        provider: 'asaas',
      };
      setReceivables((prev) => [newRec, ...prev]);
      addToast('Cobrança Asaas criada!', `Pix Copia e Cola gerado para ${newRec.clientName}.`);
    } else if (type === 'proposta') {
      const newDeal: PipelineDeal = {
        id: `deal_${Date.now()}`,
        title: data.service || 'Assessoria de Marketing',
        clientName: data.clientName || 'Novo Prospect',
        contactName: data.contactName || 'Contato Comercial',
        amount: Number(data.amount) || 6000,
        service: 'Assessoria de Marketing',
        responsible: 'Marlon Ribeiro',
        stage: 'proposta',
        daysInStage: 1,
        probability: 60,
        origin: 'Indicação',
        nextActivity: 'Follow-up de apresentação de proposta',
      };
      setPipelineDeals((prev) => [newDeal, ...prev]);
      addToast('Oportunidade adicionada ao funil!', `${newDeal.clientName} está em Proposta Enviada.`);
    } else {
      addToast('Registro salvo com sucesso!');
    }
  };

  // Select client to open 360° detail view
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentRoute('cliente-detalhe');
  };

  // Select contract to open detail view
  const handleSelectContract = () => {
    addToast('Contratos indisponíveis', 'A gestão de contratos ainda não está disponível neste aplicativo.', 'info');
  };

  // Deal stage update from kanban
  const handleUpdateDealStage = (dealId: string, newStage: PipelineDeal['stage']) => {
    setPipelineDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
    addToast('Etapa atualizada!', 'Oportunidade movida com sucesso.');
  };

  // Resolve action item
  const handleResolveActionItem = (itemId: string, title: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: 'resolvido' } : item))
    );
    addToast('Ação concluída!', title);
  };

  const financialTab = financialRouteTabs[currentRoute];
  const handleAsaasSync = async () => {
    if (isAsaasSyncing) return;
    setIsAsaasSyncing(true);
    try {
      const { clientes: totalClientes, lancamentos: totalCobrancas, transacoesExtrato } = await syncAsaasToFinance();
      addToast('Sincronização Asaas concluída', `${totalClientes} clientes, ${totalCobrancas} cobranças e ${transacoesExtrato} movimentos atualizados.`);
    } catch (error) {
      addToast(
        'Sincronização Asaas não realizada',
        error instanceof Error ? error.message : 'Tente carregar os dados demonstrativos novamente.',
        'error'
      );
    } finally {
      setIsAsaasSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-fundo-sutil dark:bg-fundo-dark text-texto-forte dark:text-texto-forte-dark transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          currentRoute={currentRoute}
          hideValues={hideValues}
          onToggleHideValues={() => setHideValues((prev) => !prev)}
          onOpenCommand={() => setIsCommandMenuOpen(true)}
          onOpenQuickCreate={handleOpenQuickCreate}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onNavigate={(route) => setCurrentRoute(route)}
          onManualSync={handleAsaasSync}
          isManualSyncing={isAsaasSyncing}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8">
          {financialTab && <EmbeddedFinanceiro key={financialTab} initialTab={financialTab} hideValues={hideValues} />}
          {currentRoute === 'dashboard' && (
            <DashboardView
              onNavigate={(route) => setCurrentRoute(route)}
              onOpenQuickCreate={handleOpenQuickCreate}
              onSelectClient={handleSelectClient}
              onSelectContract={handleSelectContract}
              clients={clients}
              contracts={contracts}
              receivables={receivables}
              actionItems={actionItems}
              onTriggerAction={(item) => handleResolveActionItem(item.id, item.title)}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'acoes' && (
            <CentralDoDiaView
              actionItems={actionItems}
              clients={clients}
              contracts={contracts}
              onTriggerAction={(item) => handleResolveActionItem(item.id, item.title)}
              onNavigate={(route) => setCurrentRoute(route)}
              onSelectClient={handleSelectClient}
              onSelectContract={handleSelectContract}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'clientes' && (
            <ClientesView
              clients={clients}
              onSelectClient={handleSelectClient}
              onOpenQuickCreate={handleOpenQuickCreate}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'inadimplentes' && (
            <InadimplentesDashboard
              clients={clients}
              receivables={receivables}
              onTriggerActionToast={(msg) => addToast('Cobrança WhatsApp', msg)}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'cliente-detalhe' && selectedClient && (
            <ClienteDetalheView
              client={selectedClient}
              contracts={contracts}
              receivables={receivables}
              onBack={() => setCurrentRoute('clientes')}
              onOpenContract={handleSelectContract}
              onOpenQuickCreate={handleOpenQuickCreate}
              onTriggerActionToast={(msg) => addToast('Notificação', msg)}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'conciliacao' && (
            <ConciliacaoBancariaView
              onTriggerToast={(title, desc) => addToast(title, desc)}
              onNavigate={(route) => setCurrentRoute(route)}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'assistente-ia' && (
            <div className="min-h-[360px] flex items-center justify-center rounded-2xl border border-alerta bg-alerta-suave/60 p-8 text-center dark:border-borda-dark/60 dark:bg-superficie-dark/20">
              <div>
                <p className="text-lg font-bold text-alerta dark:text-texto-forte-dark">Copiloto IA em construção</p>
                <p className="mt-2 text-sm text-alerta/80 dark:text-texto-forte-dark/80">Este recurso será disponibilizado em breve.</p>
              </div>
            </div>
          )}

          {currentRoute === 'notas-cobrancas' && (
            <AsaasNotasECobrancasView
              clients={clients}
              charges={asaasCharges}
              invoices={serviceInvoices}
              onAddCharge={(charge) => setAsaasCharges((prev) => [charge, ...prev])}
              onAddInvoice={(invoice) => setServiceInvoices((prev) => [invoice, ...prev])}
              onTriggerToast={(title, desc) => addToast(title, desc)}
              onNavigate={(route) => setCurrentRoute(route)}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'pipeline' && (
            <PipelineView
              deals={pipelineDeals}
              onOpenQuickCreate={handleOpenQuickCreate}
              onUpdateDealStage={handleUpdateDealStage}
              hideValues={hideValues}
            />
          )}

          {currentRoute === 'integracoes' && (
            <IntegracoesView
              integrations={integrations}
              onTriggerActionToast={(msg) => addToast('Integração', msg)}
            />
          )}

          {currentRoute === 'relatorios' && <RelatoriosView />}

          {currentRoute === 'automacoes' && <AutomacoesView />}

          {currentRoute === 'configuracoes' && <ConfiguracoesView />}
        </main>
      </div>

      {/* Global Command Menu (Cmd + K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenQuickCreate={handleOpenQuickCreate}
        clients={clients}
        contracts={contracts}
        receivables={receivables}
        onSelectClient={handleSelectClient}
        onSelectContract={handleSelectContract}
      />

      {/* Quick Create Slide-over / Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        initialType={quickCreateType}
        onClose={() => setIsQuickCreateOpen(false)}
        clients={clients}
        onAddClient={(c) => {
          setClients((prev) => [c, ...prev]);
          addToast('Cliente criado com sucesso!', `${c.name} foi adicionado à carteira.`);
        }}
        onAddContract={(c) => {
          setContracts((prev) => [c, ...prev]);
          addToast('Contrato gerado com sucesso!', 'Contrato cadastrado e cobrança Asaas pronta para configurar.');
        }}
        onAddReceivable={(r) => {
          setReceivables((prev) => [r, ...prev]);
          addToast('Cobrança Asaas criada!', `Pix Copia e Cola gerado para ${r.clientName}.`);
        }}
        onAddDeal={(d) => {
          setPipelineDeals((prev) => [d, ...prev]);
          addToast('Oportunidade adicionada ao funil!', `${d.clientName} está em Proposta Enviada.`);
        }}
      />

      {/* Toast notification toasts container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
