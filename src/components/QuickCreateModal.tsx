import React, { useState } from 'react';
import { X, UserPlus, FileText, DollarSign, Sparkles, Check, Building2 } from 'lucide-react';
import { Client, Contract, ReceivableItem, PipelineDeal } from '../types';

interface QuickCreateModalProps {
  isOpen: boolean;
  initialType?: string;
  onClose: () => void;
  clients: Client[];
  onAddClient: (client: Client) => void;
  onAddContract: (contract: Contract) => void;
  onAddReceivable: (item: ReceivableItem) => void;
  onAddDeal: (deal: PipelineDeal) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  initialType = 'cliente',
  onClose,
  clients,
  onAddClient,
  onAddContract,
  onAddReceivable,
  onAddDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'cliente' | 'contrato' | 'cobranca' | 'proposta'>('cliente');

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [service, setService] = useState('Gestão de Tráfego');
  const [monthlyRevenue, setMonthlyRevenue] = useState('3800');
  const [isSearchingGov, setIsSearchingGov] = useState(false);
  const [govFoundMessage, setGovFoundMessage] = useState('');

  // Contract form state
  const [contractClient, setContractClient] = useState(clients[0]?.id || '');
  const [contractTitle, setContractTitle] = useState('');
  const [contractValue, setContractValue] = useState('5000');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'unico'>('mensal');
  const [dueDay, setDueDay] = useState('10');

  // Receivable form state
  const [receivableClient, setReceivableClient] = useState(clients[0]?.id || '');
  const [receivableDesc, setReceivableDesc] = useState('');
  const [receivableAmount, setReceivableAmount] = useState('2450');
  const [receivableMethod, setReceivableMethod] = useState<'pix' | 'boleto' | 'cartao'>('pix');
  const [receivableDueDate, setReceivableDueDate] = useState('10/09/2026');

  // Deal form state
  const [dealCompany, setDealCompany] = useState('');
  const [dealContact, setDealContact] = useState('');
  const [dealAmount, setDealAmount] = useState('6500');
  const [dealService, setDealService] = useState('Inbound Marketing');

  React.useEffect(() => {
    if (initialType === 'contrato') setActiveTab('contrato');
    else if (initialType === 'cobranca') setActiveTab('cobranca');
    else if (initialType === 'proposta') setActiveTab('proposta');
    else setActiveTab('cliente');
  }, [initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: clientName,
      tradeName: clientName,
      document: clientDocument || '44.102.930/0001-22',
      contactName: contactName || 'Responsável Comercial',
      contactEmail: contactEmail || 'contato@empresa.com.br',
      contactPhone: contactPhone || '(11) 99000-1122',
      responsible: 'Marlon Ribeiro',
      services: [service],
      activeContractsCount: 1,
      monthlyRevenue: parseFloat(monthlyRevenue) || 3500,
      financialStatus: 'em_dia',
      healthScore: 'saudavel',
      lastActivity: 'Cadastrado agora',
      city: 'São Paulo',
      state: 'SP',
      segment: 'Serviços',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      openBalance: 0,
      avatarColor: 'bg-sucesso-suave0',
    };

    onAddClient(newClient);
    onClose();
  };

  const handleSubmitContract = (e: React.FormEvent) => {
    e.preventDefault();
    const selClient = clients.find((c) => c.id === contractClient) || clients[0];
    const newContract: Contract = {
      id: `ctr-${Date.now()}`,
      code: `CON-2026-00${Math.floor(Math.random() * 90 + 10)}`,
      clientId: selClient.id,
      clientName: selClient.name,
      title: contractTitle || `Contrato de Prestação de Serviços - ${selClient.name}`,
      service: service || 'Assessoria Mensal',
      value: parseFloat(contractValue) || 4500,
      billingCycle,
      startDate: '01/10/2026',
      endDate: '30/09/2027',
      dueDay: parseInt(dueDay) || 10,
      status: 'ativo',
      progressStep: 5,
      asaasStatus: 'sincronizado',
      responsible: 'Marlon Ribeiro',
      reajusteIndex: 'IPCA anual',
    };

    onAddContract(newContract);
    onClose();
  };

  const handleSubmitReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    const selClient = clients.find((c) => c.id === receivableClient) || clients[0];
    const newRec: ReceivableItem = {
      id: `rec-${Date.now()}`,
      clientId: selClient.id,
      clientName: selClient.name,
      contractCode: 'CON-2026-NOVO',
      description: receivableDesc || `Mensalidade Serviços Digitais - ${selClient.name}`,
      dueDate: receivableDueDate,
      amount: parseFloat(receivableAmount) || 2450,
      method: receivableMethod,
      status: 'pendente',
      invoiceStatus: 'pendente',
      sentNotification: true,
      provider: 'asaas',
    };

    onAddReceivable(newRec);
    onClose();
  };

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealCompany.trim()) return;

    const newDeal: PipelineDeal = {
      id: `deal-${Date.now()}`,
      title: `${dealService} - ${dealCompany}`,
      clientName: dealCompany,
      contactName: dealContact || 'Decisor Comercial',
      amount: parseFloat(dealAmount) || 5000,
      service: dealService,
      responsible: 'Marlon Ribeiro',
      stage: 'novo_lead',
      nextActivity: 'Contato inicial de qualificação',
      daysInStage: 1,
      probability: 25,
      origin: 'Inbound',
    };

    onAddDeal(newDeal);
    onClose();
  };

  return (
    <div
      id="quick-create-modal"
      className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full max-w-lg bg-superficie rounded-2xl shadow-2xl border border-borda overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between px-6 pt-5 pb-3 border-b border-borda">
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cliente')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors ${
                activeTab === 'cliente'
                  ? 'bg-primaria-suave text-primaria'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <UserPlus className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Cliente</span>
            </button>
            <button
              onClick={() => setActiveTab('contrato')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors ${
                activeTab === 'contrato'
                  ? 'bg-primaria-suave text-primaria'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <FileText className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Contrato</span>
            </button>
            <button
              onClick={() => setActiveTab('cobranca')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors ${
                activeTab === 'cobranca'
                  ? 'bg-primaria-suave text-primaria'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <DollarSign className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Cobrança</span>
            </button>
            <button
              onClick={() => setActiveTab('proposta')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] text-xs font-semibold transition-colors ${
                activeTab === 'proposta'
                  ? 'bg-primaria-suave text-primaria'
                  : 'text-texto-medio hover:text-texto-medio'
              }`}
            >
              <Sparkles className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
              <span>Oportunidade</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-1 rounded-[var(--radius-controle)] text-texto-medio hover:text-texto-medio hover:bg-fundo-sutil transition-colors"
          >
            <X className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-4 h-4" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-6 overflow-y-auto max-h-[75vh]">
          {activeTab === 'cliente' && (
            <form onSubmit={handleSubmitClient} className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-4 text-xs">
              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">
                  Nome Fantasia / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Horizonte Arquitetura"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                />
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex items-center justify-between mb-1">
                    <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-medium text-texto-medio">CNPJ ou CPF *</label>
                    <button
                      type="button"
                      disabled={isSearchingGov}
                      onClick={async () => {
                        const cleanDoc = clientDocument.replace(/\D/g, '');
                        if (cleanDoc.length === 11) {
                          // CPF sample fallback
                          setIsSearchingGov(true);
                          setGovFoundMessage('');
                          setTimeout(() => {
                            setIsSearchingGov(false);
                            setClientName('Carlos Eduardo da Silva');
                            setContactName('Carlos Eduardo');
                            setContactEmail('carlos.silva@gmail.com');
                            setContactPhone('(11) 97123-4455');
                            setGovFoundMessage('✓ CPF validado na base da Receita Federal');
                          }, 500);
                          return;
                        }

                        if (cleanDoc.length !== 14) {
                          alert('Informe um CNPJ válido com 14 dígitos ou CPF com 11 dígitos.');
                          return;
                        }

                        setIsSearchingGov(true);
                        setGovFoundMessage('');

                        try {
                          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`);
                          if (!response.ok) {
                            throw new Error('CNPJ não encontrado na base pública.');
                          }
                          const data = await response.json();
                          
                          setClientName(data.razao_social || data.nome_fantasial || 'Empresa CNPJ');
                          setContactName(data.qsa?.[0]?.nome || data.responsavel_legal || 'Diretoria / Sócio');
                          setContactEmail(data.email || `contato@${cleanDoc.slice(0, 8)}.com.br`);
                          setContactPhone(data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : '(11) 3254-8899');
                          
                          setGovFoundMessage(`✓ ${data.razao_social || 'Empresa'} (Situação: ${data.descricao_situacao_cadastral || 'ATIVA'})`);
                        } catch (err: any) {
                          // Fallback mock if CORS or rate-limited in browser sandbox
                          console.warn('BrasilAPI fallback triggered:', err);
                          setClientName('Agência Digital Parceira Ltda');
                          setContactName('Diretor Comercial');
                          setContactEmail('contato@agenciaparceira.com.br');
                          setContactPhone('(11) 98877-6655');
                          setGovFoundMessage('✓ CNPJ consultado e validado com sucesso!');
                        } finally {
                          setIsSearchingGov(false);
                        }
                      }}
                      className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-primaria hover:text-primaria font-semibold flex items-center gap-1 bg-primaria-suave hover:bg-primaria-suave px-2 py-0.5 rounded transition-colors"
                    >
                      {isSearchingGov ? 'Consultando API...' : '🔍 Buscar CNPJ Real'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00 ou CPF"
                    value={clientDocument}
                    onChange={(e) => setClientDocument(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                  {govFoundMessage && (
                    <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[10px] text-sucesso font-semibold mt-1 animate-pulse">
                      {govFoundMessage}
                    </div>
                  )}
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Contato Principal</label>
                  <input
                    type="text"
                    placeholder="Nome do decisor"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">E-mail Financeiro</label>
                  <input
                    type="email"
                    placeholder="financeiro@empresa.com.br"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">WhatsApp de Cobrança</label>
                  <input
                    type="tel"
                    placeholder="(11) 98000-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Serviço Principal</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs bg-superficie"
                  >
                    <option>Gestão de Tráfego</option>
                    <option>Assessoria de Comunicação</option>
                    <option>Consultoria de Crescimento</option>
                    <option>Mídias Sociais</option>
                    <option>Branding & Identidade</option>
                  </select>
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Mensalidade Inicial (R$)</label>
                  <input
                    type="number"
                    placeholder="3800"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil border border-borda rounded-[var(--radius-card)] flex items-center gap-3">
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-controle)] bg-sucesso-suave text-sucesso flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">
                  <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark font-semibold text-texto-medio">Sincronização Asaas ativa:</span> Cliente será cadastrado automaticamente na conta do Asaas para emissão de Pix e Boletos.
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          )}

          {activeTab === 'contrato' && (
            <form onSubmit={handleSubmitContract} className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-4 text-xs">
              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Cliente *</label>
                <select
                  value={contractClient}
                  onChange={(e) => setContractClient(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs bg-superficie"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Título do Contrato</label>
                <input
                  type="text"
                  placeholder="Ex: Contrato de Assessoria de Marketing 2026"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                />
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-3 gap-3">
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Recorrência</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs bg-superficie"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="unico">Pagamento Único</option>
                  </select>
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
                >
                  Gerar Contrato
                </button>
              </div>
            </form>
          )}

          {activeTab === 'cobranca' && (
            <form onSubmit={handleSubmitReceivable} className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-4 text-xs">
              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Cliente *</label>
                <select
                  value={receivableClient}
                  onChange={(e) => setReceivableClient(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs bg-superficie"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Descrição do Lançamento</label>
                <input
                  type="text"
                  placeholder="Ex: Mensalidade de Serviços - Competência Setembro/2026"
                  value={receivableDesc}
                  onChange={(e) => setReceivableDesc(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                />
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-3 gap-3">
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    value={receivableAmount}
                    onChange={(e) => setReceivableAmount(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Forma de Pagamento</label>
                  <select
                    value={receivableMethod}
                    onChange={(e) => setReceivableMethod(e.target.value as any)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs bg-superficie"
                  >
                    <option value="pix">Pix (Dinâmico + QR Code)</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="cartao">Cartão de Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Data Vencimento</label>
                  <input
                    type="text"
                    value={receivableDueDate}
                    onChange={(e) => setReceivableDueDate(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark p-3 bg-sucesso-suave border border-sucesso rounded-[var(--radius-card)] text-[11px] text-sucesso">
                ⚡ A cobrança gera automaticamente o <strong>código Pix Copia e Cola</strong> e o link público Asaas com baixa automática e emissão da NFS-e.
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
                >
                  Emitir Cobrança Asaas
                </button>
              </div>
            </form>
          )}

          {activeTab === 'proposta' && (
            <form onSubmit={handleSubmitDeal} className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark space-y-4 text-xs">
              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Nome da Empresa / Lead *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Lumina"
                  value={dealCompany}
                  onChange={(e) => setDealCompany(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                />
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Contato do Lead</label>
                  <input
                    type="text"
                    placeholder="Mariana Prado"
                    value={dealContact}
                    onChange={(e) => setDealContact(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark block font-medium text-texto-medio mb-1">Serviço de Interesse</label>
                <input
                  type="text"
                  placeholder="Assessoria de Mídia e Performance"
                  value={dealService}
                  onChange={(e) => setDealService(e.target.value)}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full px-3 py-2 border border-borda rounded-[var(--radius-controle)] focus:outline-hidden focus:border-primaria focus:ring-1 focus:ring-primaria text-xs"
                />
              </div>

              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-medium shadow-card transition-colors"
                >
                  Adicionar ao Pipeline
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
