import React, { useState } from 'react';
import {
  Receipt,
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Send,
  Sparkles,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Check,
  ShieldCheck,
  Building,
  Calendar,
  X,
  Sliders,
} from 'lucide-react';
import { Client, ServiceInvoice, AsaasChargeItem, RouteId } from '../types';
import { formatCurrency, formatCurrencyDetailed } from '../utils';
import { IntegrationLogo } from '../components/IntegrationLogo';

interface AsaasNotasECobrancasViewProps {
  clients: Client[];
  charges?: AsaasChargeItem[];
  invoices?: ServiceInvoice[];
  onAddCharge?: (charge: AsaasChargeItem) => void;
  onAddInvoice?: (invoice: ServiceInvoice) => void;
  onTriggerToast?: (title: string, desc: string) => void;
  onNavigate?: (route: RouteId) => void;
  hideValues?: boolean;
}

export const AsaasNotasECobrancasView: React.FC<AsaasNotasECobrancasViewProps> = ({
  clients = [],
  charges = [],
  invoices = [],
  onAddCharge,
  onAddInvoice,
  onTriggerToast = (_title: string, _desc?: string) => {},
  onNavigate = (_route: RouteId) => {},
  hideValues = false,
}) => {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'cobrancas' | 'notas' | 'configuracoes'>('visao_geral');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'pendente'>('todos');

  // Modal states
  const [showNewChargeModal, setShowNewChargeModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedChargeForDetails, setSelectedChargeForDetails] = useState<AsaasChargeItem | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<ServiceInvoice | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Charge form
  const [chargeClientName, setChargeClientName] = useState(clients[0]?.name || 'Alpha Ltda');
  const [chargeAmount, setChargeAmount] = useState('3500');
  const [chargeMethod, setChargeMethod] = useState<'Pix' | 'Boleto'>('Pix');
  const [chargeDueDate, setChargeDueDate] = useState('15/09/2026');
  const [chargeDescription, setChargeDescription] = useState('Serviços de Gestão de Mídia e Performance');
  const [autoEmitInvoice, setAutoEmitInvoice] = useState(true);

  // New Invoice form
  const [invoiceClientName, setInvoiceClientName] = useState(clients[0]?.name || 'Alpha Ltda');
  const [invoiceAmount, setInvoiceAmount] = useState('5200');
  const [invoiceServiceCode, setInvoiceServiceCode] = useState('17.06 - Propaganda e publicidade, inclusive promoção de vendas');
  const [invoiceDescription, setInvoiceDescription] = useState('Prestação de serviços de publicidade, tráfego pago e gestão de mídia.');
  const [invoiceIssRate, setInvoiceIssRate] = useState('2.0');
  const [invoiceSendEmail, setInvoiceSendEmail] = useState(true);

  const [autoInvoiceOnPayment, setAutoInvoiceOnPayment] = useState(true);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    onTriggerToast('Copiado para a área de transferência', 'Chave copiada com sucesso.');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(chargeAmount.replace(',', '.')) || 0;
    const newCharge: AsaasChargeItem = {
      id: `asaas-chg-${Date.now()}`,
      clientName: chargeClientName,
      amount: val,
      method: chargeMethod,
      status: 'pendente',
      statusDotColor: 'yellow',
      dueDate: chargeDueDate,
      invoiceGenerated: false,
      asaasId: `pay_${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      description: chargeDescription,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      pixCopiaECola: chargeMethod === 'Pix' ? `DEMO-PIX-${Date.now()}` : undefined,
      bankSlipCode: chargeMethod === 'Boleto' ? `03399.${Math.floor(Math.random()*90000+10000)} ${Math.floor(Math.random()*90000+10000)}.678901 2 98450000${Math.floor(val)}00` : undefined,
    };

    if (onAddCharge) onAddCharge(newCharge);
    setShowNewChargeModal(false);
    onTriggerToast('Cobrança Asaas gerada com sucesso!', `${chargeMethod} de ${formatCurrency(val, hideValues)} emitido para ${chargeClientName}.`);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(invoiceAmount.replace(',', '.')) || 0;
    const clientObj = clients.find((c) => c.name === invoiceClientName);
    const newInvoice: ServiceInvoice = {
      id: `nfse-2026-${Math.floor(Math.random() * 900 + 100)}`,
      number: `2026/${Math.floor(Math.random() * 900 + 500)}`,
      rpsNumber: `RPS ${Math.floor(Math.random() * 900 + 1400)}`,
      clientId: clientObj?.id || 'cli-custom',
      clientName: invoiceClientName,
      clientDocument: clientObj?.document || '00.000.000/0001-00',
      amount: val,
      issueDate: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      competence: '09/2026',
      serviceDescription: invoiceDescription,
      municipalServiceCode: invoiceServiceCode,
      status: 'autorizada',
      city: clientObj?.city ? `${clientObj.city} - ${clientObj.state}` : 'São Paulo - SP',
      issRate: parseFloat(invoiceIssRate) || 2.0,
      retentions: {
        iss: (val * (parseFloat(invoiceIssRate) || 2.0)) / 100,
        pis: (val * 0.65) / 100,
        cofins: (val * 3.0) / 100,
        csll: (val * 1.0) / 100,
        ir: (val * 1.5) / 100,
      },
      asaasInvoiceId: `inv_${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      sentByEmail: invoiceSendEmail,
    };

    if (onAddInvoice) onAddInvoice(newInvoice);
    setShowNewInvoiceModal(false);
    onTriggerToast('NFS-e Emitida com Sucesso!', `Nota fiscal Nº ${newInvoice.number} autorizada pela prefeitura via Asaas.`);
  };

  // Metrics for overview cards
  const totalInvoicesCount = 23; // Exact match to screenshot
  const totalInvoicesAmount = 47800; // Exact match to screenshot R$ 47.800

  const filteredCharges = charges.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.asaasId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.serviceDescription.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-8 pb-16">
      {/* Top Header */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3">
            <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight">
              Emissão de Notas & Cobranças
            </h1>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF0FF] text-[#0030B9] border border-[#C5D5FA]">
              <IntegrationLogo logo="asaas" size="sm" className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 rounded-xs" />
              <span>Gateway Asaas Ativo</span>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-1.5 h-1.5 rounded-full bg-[#0030B9] animate-pulse"></span>
            </span>
          </div>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio mt-1">
            Plataforma integrada de emissão de NFS-e direto na prefeitura e geração de cobranças Pix e Boleto via Asaas.
          </p>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-emitir-cobranca"
            onClick={() => setShowNewChargeModal(true)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-4 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold shadow-sutil transition-colors"
          >
            <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
            <span>Emitir Cobrança Asaas</span>
          </button>

          <button
            id="btn-emitir-nfse"
            onClick={() => setShowNewInvoiceModal(true)}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-4 py-2 rounded-[var(--radius-controle)] bg-superficie border border-borda hover:bg-fundo-sutil text-texto-medio text-xs font-semibold shadow-sutil transition-colors"
          >
            <Receipt className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-[var(--color-primaria)]" />
            <span>Emitir NFS-e</span>
          </button>
        </div>
      </div>

      {/* Info notice about Asaas scope as requested by user */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 bg-primaria-suave/60 border border-primaria rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-start gap-3">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-8 h-8 rounded-[var(--radius-card)] bg-[#DDF2FE] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
          </div>
          <div>
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio block">
              Módulo exclusivo para usuários da plataforma Asaas
            </span>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio mt-0.5">
              Esta funcionalidade utiliza a API do Asaas como motor unificado para emitir cobranças com conciliação automática e disparar as Notas Fiscais de Serviço (NFS-e) na prefeitura assim que liquidadas.
            </p>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={() => setActiveTab('configuracoes')}
            className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-[var(--color-primaria)] hover:underline flex items-center gap-1"
          >
            <span>Ver credenciais e Webhooks</span>
            <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark border-b border-borda flex items-center gap-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab('visao_geral')}
          className={`pb-3.5 relative transition-colors ${
            activeTab === 'visao_geral'
              ? 'text-[var(--color-primaria)] font-semibold'
              : 'text-texto-medio hover:text-texto-medio'
          }`}
        >
          Visão Geral & Destaques
          {activeTab === 'visao_geral' && (
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primaria)] rounded-t-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cobrancas')}
          className={`pb-3.5 relative transition-colors ${
            activeTab === 'cobrancas'
              ? 'text-[var(--color-primaria)] font-semibold'
              : 'text-texto-medio hover:text-texto-medio'
          }`}
        >
          Cobranças Emitidas (Pix & Boleto)
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark ml-2 px-2 py-0.5 text-xs rounded-full bg-fundo-sutil text-texto-medio">
            {charges.length}
          </span>
          {activeTab === 'cobrancas' && (
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primaria)] rounded-t-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('notas')}
          className={`pb-3.5 relative transition-colors ${
            activeTab === 'notas'
              ? 'text-[var(--color-primaria)] font-semibold'
              : 'text-texto-medio hover:text-texto-medio'
          }`}
        >
          Notas Fiscais de Serviço (NFS-e)
          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark ml-2 px-2 py-0.5 text-xs rounded-full bg-fundo-sutil text-texto-medio">
            {invoices.length}
          </span>
          {activeTab === 'notas' && (
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primaria)] rounded-t-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`pb-3.5 relative transition-colors ${
            activeTab === 'configuracoes'
              ? 'text-[var(--color-primaria)] font-semibold'
              : 'text-texto-medio hover:text-texto-medio'
          }`}
        >
          Configurações Asaas
          {activeTab === 'configuracoes' && (
            <span className="dark:bg-fundo-dark dark:text-texto-forte-dark absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primaria)] rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL (SHOWCASING THE EXACT CARDS FROM THE USER'S SCREENSHOT) */}
      {activeTab === 'visao_geral' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-8">
          {/* THE TWO FEATURE CARDS FROM SCREENSHOT */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CARD 1: NOTA FISCAL DE SERVIÇO */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[#F8F9FB] border border-borda/80 rounded-3xl p-8 flex flex-col justify-between shadow-sutil hover:border-borda-forte transition-all">
              <div>
                {/* Blue Icon on Top */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-center">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-14 h-14 rounded-2xl bg-[#DDF2FE] text-[#0284C7] flex items-center justify-center shadow-sutil">
                    <Receipt className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7" />
                  </div>
                </div>

                {/* Title and Subtitle */}
                <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight text-center mt-5 mb-2">
                  Nota Fiscal de Serviço
                </h2>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm text-texto-medio text-center max-w-sm mx-auto mb-8 font-normal leading-relaxed">
                  Emita NFS-e direto do sistema, sem portal da prefeitura.
                </p>

                {/* Inner White Container */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda shadow-sutil p-6 space-y-6">
                  {/* Header: Notas fiscais / Este mês */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio text-sm">Notas fiscais</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio font-normal">Este mês</span>
                  </div>

                  {/* 2 Metric Boxes */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                    {/* Emitidas */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie border border-borda rounded-[var(--radius-card)] p-4">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio font-medium block mb-1">Emitidas</span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight block">
                        {totalInvoicesCount}
                      </span>
                    </div>

                    {/* Valor total */}
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie border border-borda rounded-[var(--radius-card)] p-4">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio font-medium block mb-1">Valor total</span>
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight block">
                        {hideValues ? '••••••' : 'R$ 47.800'}
                      </span>
                    </div>
                  </div>

                  {/* Bullet list with small blue dots */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3 pt-2">
                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 text-xs font-medium text-texto-medio">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-[#0080FF] shrink-0"></span>
                      <span>Integrada à prefeitura</span>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 text-xs font-medium text-texto-medio">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-[#0080FF] shrink-0"></span>
                      <span>Envio automático por e-mail</span>
                    </div>

                    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-3 text-xs font-medium text-texto-medio">
                      <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-[#0080FF] shrink-0"></span>
                      <span>Consulta de situação tributária</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-8 flex items-center justify-between pt-4 border-t border-borda/60">
                <button
                  onClick={() => setShowNewInvoiceModal(true)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:text-primaria flex items-center gap-1.5"
                >
                  <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                  <span>Nova emissão de NFS-e</span>
                </button>

                <button
                  onClick={() => setActiveTab('notas')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio hover:text-texto-medio flex items-center gap-1"
                >
                  <span>Ver todas ({invoices.length})</span>
                  <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CARD 2: EMISSÃO DE COBRANÇAS */}
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[#F8F9FB] border border-borda/80 rounded-3xl p-8 flex flex-col justify-between shadow-sutil hover:border-borda-forte transition-all">
              <div>
                {/* Blue Icon on Top */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-center">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-14 h-14 rounded-2xl bg-[#DDF2FE] text-[#0284C7] flex items-center justify-center shadow-sutil">
                    <FileText className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7" />
                  </div>
                </div>

                {/* Title and Subtitle */}
                <h2 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-2xl font-bold text-texto-medio tracking-tight text-center mt-5 mb-2">
                  Emissão de Cobranças
                </h2>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm text-texto-medio text-center max-w-sm mx-auto mb-8 font-normal leading-relaxed">
                  Emita boletos e Pix automaticamente para seus clientes.
                </p>

                {/* Inner White Container */}
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda shadow-sutil p-6 space-y-3">
                  {/* Header: Cobranças emitidas / Badge Pix + Boleto */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between mb-2">
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio text-sm">Cobranças emitidas</span>
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-[var(--color-primaria)] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Pix + Boleto
                    </span>
                  </div>

                  {/* List of 5 items matching the exact screenshot */}
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2.5">
                    {/* Item 1: Alpha Ltda - Pix - R$ 5.200 (blue dot) */}
                    <div
                      onClick={() => {
                        const item = charges.find((c) => c.clientName === 'Alpha Ltda') || charges[0];
                        if (item) setSelectedChargeForDetails(item);
                      }}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark border border-borda hover:border-borda rounded-[var(--radius-card)] p-3.5 bg-superficie flex items-center justify-between cursor-pointer transition-all hover:shadow-sutil"
                    >
                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Alpha Ltda</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">Pix</div>
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {hideValues ? '••••' : 'R$ 5.200'}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave shrink-0"></span>
                      </div>
                    </div>

                    {/* Item 2: Beta ME - Boleto - R$ 3.800 (yellow dot) */}
                    <div
                      onClick={() => {
                        const item = charges.find((c) => c.clientName === 'Beta ME') || charges[1];
                        if (item) setSelectedChargeForDetails(item);
                      }}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark border border-borda hover:border-borda rounded-[var(--radius-card)] p-3.5 bg-superficie flex items-center justify-between cursor-pointer transition-all hover:shadow-sutil"
                    >
                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Beta ME</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">Boleto</div>
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {hideValues ? '••••' : 'R$ 3.800'}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-alerta-suave shrink-0"></span>
                      </div>
                    </div>

                    {/* Item 3: Gamma SA - Pix - R$ 12.000 (blue dot) */}
                    <div
                      onClick={() => {
                        const item = charges.find((c) => c.clientName === 'Gamma SA') || charges[2];
                        if (item) setSelectedChargeForDetails(item);
                      }}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark border border-borda hover:border-borda rounded-[var(--radius-card)] p-3.5 bg-superficie flex items-center justify-between cursor-pointer transition-all hover:shadow-sutil"
                    >
                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Gamma SA</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">Pix</div>
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {hideValues ? '••••' : 'R$ 12.000'}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave shrink-0"></span>
                      </div>
                    </div>

                    {/* Item 4: Delta EIRELI - Boleto - R$ 2.450 (blue dot) */}
                    <div
                      onClick={() => {
                        const item = charges.find((c) => c.clientName === 'Delta EIRELI') || charges[3];
                        if (item) setSelectedChargeForDetails(item);
                      }}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark border border-borda hover:border-borda rounded-[var(--radius-card)] p-3.5 bg-superficie flex items-center justify-between cursor-pointer transition-all hover:shadow-sutil"
                    >
                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Delta EIRELI</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">Boleto</div>
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {hideValues ? '••••' : 'R$ 2.450'}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave shrink-0"></span>
                      </div>
                    </div>

                    {/* Item 5: Epsilon ME - Pix - R$ 4.100 (blue dot) */}
                    <div
                      onClick={() => {
                        const item = charges.find((c) => c.clientName === 'Epsilon ME') || charges[4];
                        if (item) setSelectedChargeForDetails(item);
                      }}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark border border-borda hover:border-borda rounded-[var(--radius-card)] p-3.5 bg-superficie flex items-center justify-between cursor-pointer transition-all hover:shadow-sutil"
                    >
                      <div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Epsilon ME</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio mt-0.5">Pix</div>
                      </div>
                      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-bold text-texto-medio">
                          {hideValues ? '••••' : 'R$ 4.100'}
                        </span>
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2 h-2 rounded-full bg-primaria-suave shrink-0"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark mt-8 flex items-center justify-between pt-4 border-t border-borda/60">
                <button
                  onClick={() => setShowNewChargeModal(true)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-[var(--color-primaria)] hover:text-primaria flex items-center gap-1.5"
                >
                  <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                  <span>Nova cobrança</span>
                </button>

                <button
                  onClick={() => setActiveTab('cobrancas')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-medium text-texto-medio hover:text-texto-medio flex items-center gap-1"
                >
                  <span>Ver todas ({charges.length})</span>
                  <ArrowRight className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats & Asaas Automation Flow */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl border border-borda p-6 shadow-sutil">
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio mb-4 flex items-center gap-2">
              <ShieldCheck className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-sucesso" />
              <span>Como funciona o fluxo integrado Asaas no sistema</span>
            </h3>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda space-y-1.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)] font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">Geração de Cobrança</div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio leading-relaxed">
                  O sistema gera o Pix dinâmico ou Boleto bancário com QR Code via API do Asaas e envia para o cliente por e-mail e WhatsApp.
                </p>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda space-y-1.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-[var(--radius-controle)] bg-sucesso-suave text-sucesso font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">Baixa Automática (Webhook)</div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio leading-relaxed">
                  Assim que o cliente efetua o pagamento, o Asaas notifica o sistema via Webhook e a conta é baixada em tempo real sem conciliação manual.
                </p>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda space-y-1.5">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-7 h-7 rounded-[var(--radius-controle)] bg-primaria-suave text-primaria font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">Emissão e Envio da NFS-e</div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio leading-relaxed">
                  A NFS-e é gerada automaticamente na prefeitura correspondente e o link do XML e PDF é enviado imediatamente para o financeiro do cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COBRANÇAS EMITIDAS */}
      {activeTab === 'cobrancas' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
              <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-texto-medio" />
              <input
                type="text"
                placeholder="Buscar por cliente, descrição ou ID Asaas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs focus:outline-hidden focus:ring-2 focus:ring-primaria bg-superficie"
              />
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3 py-2 border border-borda rounded-[var(--radius-controle)] text-xs bg-superficie text-texto-medio"
              >
                <option value="todos">Todos os status</option>
                <option value="pago">Apenas Pagos</option>
                <option value="pendente">Apenas Pendentes</option>
              </select>

              <button
                onClick={() => setShowNewChargeModal(true)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold"
              >
                <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                <span>Nova Cobrança</span>
              </button>
            </div>
          </div>

          {/* Charges Table */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie border border-borda rounded-2xl overflow-hidden shadow-sutil">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark overflow-x-auto">
              <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
                <thead>
                  <tr className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil/75 border-b border-borda text-texto-medio font-semibold uppercase tracking-wider text-[11px]">
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Cliente & ID Asaas</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Forma</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Valor</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Vencimento</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Status</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">NFS-e Vinculada</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-gray-100">
                  {filteredCharges.map((item) => (
                    <tr key={item.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-fundo-sutil/80 transition-colors">
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">{item.clientName}</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio font-mono mt-0.5">{item.asaasId}</div>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] bg-fundo-sutil text-texto-medio">
                          {item.method === 'Pix' ? <QrCode className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-primaria" /> : <FileText className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3 text-alerta" />}
                          {item.method}
                        </span>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-bold text-texto-medio">
                        {formatCurrency(item.amount, hideValues)}
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio">
                        {item.dueDate}
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        {item.status === 'pago' ? (
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sucesso-suave text-sucesso border border-sucesso">
                            <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            Liquidado
                          </span>
                        ) : (
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-alerta-suave text-alerta border border-alerta">
                            <Clock className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                            Aguardando
                          </span>
                        )}
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        {item.invoiceGenerated ? (
                          <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-primaria font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5 text-primaria" />
                            {item.invoiceNumber || 'Emitida'}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setInvoiceClientName(item.clientName);
                              setInvoiceAmount(String(item.amount));
                              setShowNewInvoiceModal(true);
                            }}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio hover:text-[var(--color-primaria)] underline"
                          >
                            + Emitir NFS-e agora
                          </button>
                        )}
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedChargeForDetails(item)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-md bg-fundo-sutil hover:bg-fundo-sutil text-texto-medio text-[11px] font-medium transition-colors"
                          >
                            Ver Cobrança
                          </button>
                          {item.pixCopiaECola && (
                            <button
                              onClick={() => copyToClipboard(item.pixCopiaECola!, item.id)}
                              title="Copiar Pix Copia e Cola"
                              className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-primaria rounded-md hover:bg-primaria-suave"
                            >
                              <Copy className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTAS FISCAIS (NFS-E) */}
      {activeTab === 'notas' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark relative flex-1 max-w-md">
              <Search className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-texto-medio" />
              <input
                type="text"
                placeholder="Buscar por cliente, número ou descrição da nota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full pl-9 pr-4 py-2 border border-borda rounded-[var(--radius-controle)] text-xs focus:outline-hidden focus:ring-2 focus:ring-primaria bg-superficie"
              />
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
              <button
                onClick={() => setShowNewInvoiceModal(true)}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-controle)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold"
              >
                <Plus className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4" />
                <span>Nova NFS-e</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie border border-borda rounded-2xl overflow-hidden shadow-sutil">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark overflow-x-auto">
              <table className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full text-left text-xs">
                <thead>
                  <tr className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-fundo-sutil/75 border-b border-borda text-texto-medio font-semibold uppercase tracking-wider text-[11px]">
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">NFS-e Nº</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Tomador (Cliente)</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Emissão & Competência</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Valor Bruto</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">ISS (Alíquota)</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4">Status Prefeitura</th>
                    <th className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3 px-4 text-right">Downloads & Ações</th>
                  </tr>
                </thead>
                <tbody className="dark:bg-fundo-dark dark:text-texto-forte-dark divide-y divide-gray-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="dark:bg-fundo-dark dark:text-texto-forte-dark hover:bg-fundo-sutil/80 transition-colors">
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">{inv.number}</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{inv.rpsNumber}</div>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">{inv.clientName}</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{inv.clientDocument}</div>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio">
                        <div>{inv.issueDate}</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">Comp. {inv.competence}</div>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 font-bold text-texto-medio">
                        {formatCurrencyDetailed(inv.amount, hideValues)}
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-texto-medio">
                        <div>{formatCurrency(inv.retentions.iss, hideValues)}</div>
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">({inv.issRate}%)</div>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4">
                        <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sucesso-suave text-sucesso border border-sucesso">
                          <Check className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3 h-3" />
                          Autorizada
                        </span>
                      </td>
                      <td className="dark:bg-fundo-dark dark:text-texto-forte-dark py-3.5 px-4 text-right">
                        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoiceForDetails(inv)}
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark px-2.5 py-1 rounded-md bg-fundo-sutil hover:bg-fundo-sutil text-texto-medio text-[11px] font-medium"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            onClick={() => onTriggerToast('Download iniciado', `Baixando PDF da NFS-e ${inv.number}`)}
                            title="Baixar PDF da Nota Fiscal"
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-primaria rounded-md hover:bg-primaria-suave"
                          >
                            <Download className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onTriggerToast('Nota reenviada', `NFS-e ${inv.number} reenviada para o e-mail do cliente`)}
                            title="Reenviar por e-mail"
                            className="dark:bg-fundo-dark dark:text-texto-forte-dark p-1 text-texto-medio hover:text-sucesso rounded-md hover:bg-sucesso-suave"
                          >
                            <Send className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURAÇÕES DO ASAAS */}
      {activeTab === 'configuracoes' && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark max-w-3xl space-y-6">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie border border-borda rounded-2xl p-6 shadow-sutil space-y-6">
            <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">
              Configurações da Integração Asaas
            </h3>
            <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio -mt-4">
              Defina como o gateway do Asaas deve se comportar para emissão automática de cobranças e notas fiscais.
            </p>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda">
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">
                    Utilizar Asaas como plataforma exclusiva de cobrança
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">
                    Garante que todas as novas cobranças sejam geradas com Pix e Boleto registrados no Asaas.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-primaria rounded focus:ring-primaria"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between p-4 rounded-[var(--radius-card)] bg-fundo-sutil border border-borda">
                <div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">
                    Emissão automática de NFS-e na liquidação
                  </div>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">
                    Assim que a cobrança do cliente for paga (Pix ou Boleto), a prefeitura recebe o RPS para autorizar a nota.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoInvoiceOnPayment}
                  onChange={(e) => setAutoInvoiceOnPayment(e.target.checked)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-primaria rounded focus:ring-primaria"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1.5">
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Ambiente Asaas</label>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled
                    className={`p-3 rounded-[var(--radius-card)] border text-xs font-semibold text-left transition-all ${
                      'border-primaria bg-primaria-suave/50 text-primaria'
                    }`}
                  >
                    Modo demonstração
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-[11px] font-normal text-texto-medio mt-0.5">
                      Dados fictícios, sem chamadas externas.
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled
                    className={`p-3 rounded-[var(--radius-card)] border text-xs font-semibold text-left transition-all ${
                      'border-borda bg-superficie text-texto-medio'
                    }`}
                  >
                    Sem ambiente externo
                    <span className="dark:bg-fundo-dark dark:text-texto-forte-dark block text-[11px] font-normal text-texto-medio mt-0.5">
                      Apenas registros fictícios locais.
                    </span>
                  </button>
                </div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1.5">
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs font-semibold text-texto-medio">Dados de demonstração</label>
                <input
                  type="password"
                  value="Nenhuma chave é utilizada"
                  readOnly
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs font-mono bg-superficie focus:outline-hidden focus:ring-2 focus:ring-primaria"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-4 bg-sucesso-suave border border-sucesso rounded-[var(--radius-card)] text-xs space-y-1">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-sucesso flex items-center gap-1.5">
                  <CheckCircle2 className="dark:bg-fundo-dark dark:text-texto-forte-dark w-4 h-4 text-sucesso" />
                  <span>Modo demonstração ativo</span>
                </div>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso text-[11px]">
                  Não há endpoint ou webhook externo configurado.
                </p>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end pt-4 border-t border-borda">
              <button
                onClick={() => onTriggerToast('Configurações salvas', 'Parâmetros da integração Asaas atualizados com sucesso.')}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-5 py-2.5 rounded-[var(--radius-card)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold shadow-sutil"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMITIR NOVA COBRANÇA ASAAS */}
      {showNewChargeModal && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-borda max-h-[90vh] overflow-y-auto">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-borda">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)]">
                  <DollarSign className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">Emitir Cobrança Asaas</h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">Gere cobrança Pix e Boleto registrada no Asaas</p>
                </div>
              </div>
              <button onClick={() => setShowNewChargeModal(false)} className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio">
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCharge} className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4 mt-4 text-xs">
              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Cliente (Tomador)</label>
                <select
                  value={chargeClientName}
                  onChange={(e) => setChargeClientName(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs bg-superficie"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.document})
                    </option>
                  ))}
                  <option value="Beta ME">Beta ME (12.345.678/0001-90)</option>
                  <option value="Gamma SA">Gamma SA (18.491.029/0001-55)</option>
                  <option value="Delta EIRELI">Delta EIRELI (31.849.201/0001-83)</option>
                  <option value="Epsilon ME">Epsilon ME (50.192.834/0001-90)</option>
                </select>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Valor da Cobrança (R$)</label>
                  <input
                    type="text"
                    required
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder="3500.00"
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Data de Vencimento</label>
                  <input
                    type="text"
                    required
                    value={chargeDueDate}
                    onChange={(e) => setChargeDueDate(e.target.value)}
                    placeholder="15/09/2026"
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Forma de Pagamento</label>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-[var(--radius-card)] border flex items-center gap-2 cursor-pointer transition-colors ${
                    chargeMethod === 'Pix' ? 'border-[var(--color-primaria)] bg-primaria-suave/40 font-bold text-primaria' : 'border-borda'
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      checked={chargeMethod === 'Pix'}
                      onChange={() => setChargeMethod('Pix')}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark text-primaria"
                    />
                    <span>Pix Instantâneo (QR Code)</span>
                  </label>

                  <label className={`p-3 rounded-[var(--radius-card)] border flex items-center gap-2 cursor-pointer transition-colors ${
                    chargeMethod === 'Boleto' ? 'border-[var(--color-primaria)] bg-primaria-suave/40 font-bold text-primaria' : 'border-borda'
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      checked={chargeMethod === 'Boleto'}
                      onChange={() => setChargeMethod('Boleto')}
                      className="dark:bg-fundo-dark dark:text-texto-forte-dark text-primaria"
                    />
                    <span>Boleto Bancário Registrado</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Descrição / Discriminação</label>
                <input
                  type="text"
                  required
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil border border-borda rounded-[var(--radius-card)] space-y-2">
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEmitInvoice}
                    onChange={(e) => setAutoEmitInvoice(e.target.checked)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark rounded text-primaria"
                  />
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">
                    Emitir NFS-e automaticamente na liquidação bancária
                  </span>
                </label>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end gap-2 pt-4 border-t border-borda">
                <button
                  type="button"
                  onClick={() => setShowNewChargeModal(false)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-card)] font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-5 py-2 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-card)] font-semibold shadow-sutil transition-colors"
                >
                  Gerar Cobrança Asaas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMITIR NOVA NFS-E DE SERVIÇO */}
      {showNewInvoiceModal && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-borda max-h-[90vh] overflow-y-auto">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-borda">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2 rounded-[var(--radius-controle)] bg-primaria-suave text-[var(--color-primaria)]">
                  <Receipt className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
                </div>
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-base font-bold text-texto-medio">Emitir NFS-e de Serviço</h3>
                  <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio">Transmissão eletrônica para prefeitura via Asaas</p>
                </div>
              </div>
              <button onClick={() => setShowNewInvoiceModal(false)} className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio">
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-4 mt-4 text-xs">
              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Cliente Tomador</label>
                <select
                  value={invoiceClientName}
                  onChange={(e) => setInvoiceClientName(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs bg-superficie"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.document})
                    </option>
                  ))}
                  <option value="Alpha Ltda">Alpha Ltda (42.610.778/0001-31)</option>
                  <option value="Gamma SA">Gamma SA (18.491.029/0001-55)</option>
                  <option value="Delta EIRELI">Delta EIRELI (31.849.201/0001-83)</option>
                  <option value="Epsilon ME">Epsilon ME (50.192.834/0001-90)</option>
                </select>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-2 gap-3">
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Valor do Serviço (R$)</label>
                  <input
                    type="text"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="5200.00"
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Alíquota ISS (%)</label>
                  <input
                    type="text"
                    required
                    value={invoiceIssRate}
                    onChange={(e) => setInvoiceIssRate(e.target.value)}
                    placeholder="2.0"
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Código de Serviço Municipal</label>
                <select
                  value={invoiceServiceCode}
                  onChange={(e) => setInvoiceServiceCode(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs bg-superficie"
                >
                  <option value="17.06 - Propaganda e publicidade, inclusive promoção de vendas">
                    17.06 - Propaganda e publicidade, promoção de vendas
                  </option>
                  <option value="17.01 - Assessoria ou consultoria de qualquer natureza">
                    17.01 - Assessoria ou consultoria de qualquer natureza
                  </option>
                  <option value="1.03 - Processamento de dados e congêneres">
                    1.03 - Processamento de dados e tecnologia
                  </option>
                </select>
              </div>

              <div>
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark block font-semibold text-texto-medio mb-1">Discriminação dos Serviços</label>
                <textarea
                  rows={3}
                  required
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full px-3.5 py-2.5 rounded-[var(--radius-card)] border border-borda text-xs"
                />
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-primaria-suave/60 border border-primaria rounded-[var(--radius-card)] space-y-1.5">
                <label className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceSendEmail}
                    onChange={(e) => setInvoiceSendEmail(e.target.checked)}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark rounded text-primaria"
                  />
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">
                    Enviar XML e PDF da nota automaticamente por e-mail para o cliente
                  </span>
                </label>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end gap-2 pt-4 border-t border-borda">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-2 border border-borda rounded-[var(--radius-card)] font-medium text-texto-medio hover:bg-fundo-sutil"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark px-5 py-2 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-card)] font-semibold shadow-sutil transition-colors"
                >
                  Transmitir NFS-e
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DA COBRANÇA (QR CODE PIX / BOLETO) */}
      {selectedChargeForDetails && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-md w-full p-6 shadow-2xl border border-borda space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-borda">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark w-2.5 h-2.5 rounded-full bg-primaria-suave"></span>
                <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio">{selectedChargeForDetails.clientName}</h3>
              </div>
              <button onClick={() => setSelectedChargeForDetails(null)} className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio">
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-center py-2">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-xs text-texto-medio font-medium">Valor da Cobrança Asaas</span>
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-3xl font-bold text-texto-medio mt-1">
                {formatCurrency(selectedChargeForDetails.amount, hideValues)}
              </div>
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark inline-block px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-primaria-suave text-primaria">
                {selectedChargeForDetails.method} · Vence em {selectedChargeForDetails.dueDate}
              </span>
            </div>

            {selectedChargeForDetails.method === 'Pix' && selectedChargeForDetails.pixCopiaECola && (
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3 p-4 bg-fundo-sutil rounded-[var(--radius-card)] border border-borda">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-center">
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark w-40 h-40 bg-superficie border border-borda rounded-[var(--radius-card)] flex items-center justify-center p-2 shadow-sutil">
                    <QrCode className="dark:bg-fundo-dark dark:text-texto-forte-dark w-32 h-32 text-texto-medio" />
                  </div>
                </div>

                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-1">
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-semibold text-texto-medio block">Pix Copia e Cola:</span>
                  <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2 bg-superficie rounded-[var(--radius-controle)] border border-borda text-[10px] font-mono break-all text-texto-medio select-all">
                    {selectedChargeForDetails.pixCopiaECola}
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedChargeForDetails.pixCopiaECola!, 'modal-pix')}
                    className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full mt-2 py-1.5 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Copy className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                    <span>{copiedCode === 'modal-pix' ? 'Copiado!' : 'Copiar Código Pix'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedChargeForDetails.method === 'Boleto' && selectedChargeForDetails.bankSlipCode && (
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-3 p-4 bg-fundo-sutil rounded-[var(--radius-card)] border border-borda">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] font-semibold text-texto-medio block">Linha Digitável do Boleto:</span>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-superficie rounded-[var(--radius-controle)] border border-borda text-[11px] font-mono text-texto-medio select-all">
                  {selectedChargeForDetails.bankSlipCode}
                </div>
                <button
                  onClick={() => copyToClipboard(selectedChargeForDetails.bankSlipCode!, 'modal-boleto')}
                  className="dark:bg-fundo-dark dark:text-texto-forte-dark w-full py-1.5 bg-[var(--color-primaria)] hover:bg-primaria-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Copy className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
                  <span>{copiedCode === 'modal-boleto' ? 'Copiado!' : 'Copiar Linha Digitável'}</span>
                </button>
              </div>
            )}

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between items-center text-xs text-texto-medio pt-2">
              <span>Asaas ID: {selectedChargeForDetails.asaasId}</span>
              <button
                onClick={() => {
                  onTriggerToast('Link enviado', `Cobrança enviada via WhatsApp para ${selectedChargeForDetails.clientName}`);
                  setSelectedChargeForDetails(null);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-primaria)] hover:underline font-semibold"
              >
                Enviar via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DA NFS-E */}
      {selectedInvoiceForDetails && (
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-borda space-y-4">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center justify-between pb-3 border-b border-borda">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2">
                <Receipt className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5 text-primaria" />
                <div>
                  <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-bold text-texto-medio">NFS-e Nº {selectedInvoiceForDetails.number}</h3>
                  <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[11px] text-texto-medio">{selectedInvoiceForDetails.rpsNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceForDetails(null)} className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio">
                <X className="dark:bg-fundo-dark dark:text-texto-forte-dark w-5 h-5" />
              </button>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2.5 text-xs text-texto-medio">
              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark p-3 bg-fundo-sutil rounded-[var(--radius-card)] border border-borda space-y-1">
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark font-semibold text-texto-medio">Tomador dos Serviços:</div>
                <div>{selectedInvoiceForDetails.clientName}</div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-mono text-[11px]">{selectedInvoiceForDetails.clientDocument}</div>
                <div className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio text-[11px]">{selectedInvoiceForDetails.city}</div>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1 border-b border-borda">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">Valor Bruto:</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark font-bold text-texto-medio">
                  {formatCurrencyDetailed(selectedInvoiceForDetails.amount, hideValues)}
                </span>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1 border-b border-borda">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">ISS ({selectedInvoiceForDetails.issRate}%):</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium">
                  {formatCurrencyDetailed(selectedInvoiceForDetails.retentions.iss, hideValues)}
                </span>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1 border-b border-borda">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio">Código de Tributação:</span>
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio font-medium text-right max-w-xs">
                  {selectedInvoiceForDetails.municipalServiceCode}
                </span>
              </div>

              <div className="dark:bg-fundo-dark dark:text-texto-forte-dark py-1">
                <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-texto-medio block mb-1">Discriminação:</span>
                <p className="dark:bg-fundo-dark dark:text-texto-forte-dark p-2.5 bg-fundo-sutil rounded-[var(--radius-controle)] text-texto-medio leading-relaxed text-[11px]">
                  {selectedInvoiceForDetails.serviceDescription}
                </p>
              </div>
            </div>

            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-end gap-2 pt-3 border-t border-borda">
              <button
                onClick={() => {
                  onTriggerToast('Download XML', `Baixando XML da NFS-e ${selectedInvoiceForDetails.number}`);
                  setSelectedInvoiceForDetails(null);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-3.5 py-1.5 rounded-[var(--radius-card)] border border-borda text-xs font-medium text-texto-medio hover:bg-fundo-sutil"
              >
                Download XML
              </button>
              <button
                onClick={() => {
                  onTriggerToast('Download PDF', `Baixando PDF oficial da NFS-e ${selectedInvoiceForDetails.number}`);
                  setSelectedInvoiceForDetails(null);
                }}
                className="dark:bg-fundo-dark dark:text-texto-forte-dark px-4 py-1.5 rounded-[var(--radius-card)] bg-[var(--color-primaria)] hover:bg-primaria-suave text-white text-xs font-semibold"
              >
                Baixar PDF da Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
