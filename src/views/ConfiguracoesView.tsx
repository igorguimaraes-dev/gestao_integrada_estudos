import React, { useState } from 'react';
import { Settings, Shield, Users, Building, Key, Bell, CheckCircle2, Sun, Moon, Laptop, Palette, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

export const ConfiguracoesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios' | 'fiscal' | 'api' | 'aparencia'>('empresa');
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--color-texto-forte)] dark:text-white">Configurações da Empresa</h1>
        <p className="text-[13px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark mt-0.5">
          Dados cadastrais, usuários e permissões de acesso, aparência da plataforma, credenciais fiscais e chaves de integração.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-borda)] dark:border-borda-dark pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'empresa', label: 'Empresa & Identidade' },
          { id: 'aparencia', label: 'Aparência & Tema' },
          { id: 'usuarios', label: 'Usuários & Permissões' },
          { id: 'fiscal', label: 'Regras de Cobrança & Fiscal' },
          { id: 'api', label: 'Chaves de API & Webhooks' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-[var(--radius-controle)] transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-[#EEF0FD] dark:bg-navy-claro/50 text-[var(--color-primaria)] dark:text-primaria-clara font-bold'
                : 'text-[var(--color-texto-medio)] dark:text-texto-medio-dark hover:bg-[var(--color-fundo-sutil)] dark:hover:bg-fundo-sutil'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'aparencia' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-[var(--color-borda)] dark:border-borda-dark shadow-sutil space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-texto-forte)] dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-primaria dark:text-primaria-clara" />
                Preferência de Tema
              </h3>
              <p className="text-[var(--color-texto-medio)] dark:text-texto-medio-dark mt-1">
                Escolha o esquema de cores que melhor se adapta ao seu ambiente de trabalho ou permita que o sistema sincronize com o seu dispositivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Claro */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-[var(--radius-card)] border-2 text-left transition-all relative flex flex-col justify-between ${
                  theme === 'light'
                    ? 'border-primaria bg-primaria-suave/20 dark:bg-navy-claro/20 shadow-sutil'
                    : 'border-borda dark:border-borda-dark bg-superficie dark:bg-navy/50 hover:border-borda-forte dark:hover:border-borda'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-[var(--radius-controle)] bg-alerta-suave dark:bg-superficie-dark/40 text-alerta dark:text-texto-forte-dark flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-primaria text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--color-texto-forte)] dark:text-white">Modo Claro</h4>
                  <p className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark mt-1 leading-relaxed">
                    Fundo claro e limpo com alto contraste para ambientes bem iluminados.
                  </p>
                </div>
                {/* Visual miniature */}
                <div className="mt-4 p-2 rounded-[var(--radius-controle)] bg-fundo-sutil border border-borda flex flex-col gap-1.5 pointer-events-none">
                  <div className="h-2 w-12 bg-fundo-sutil rounded-xs"></div>
                  <div className="h-3 w-full bg-superficie rounded-xs border border-borda flex items-center px-1">
                    <div className="h-1.5 w-6 bg-primaria-suave rounded-2xs"></div>
                  </div>
                </div>
              </button>

              {/* Option 2: Escuro */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-[var(--radius-card)] border-2 text-left transition-all relative flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'border-primaria bg-primaria-suave/20 dark:bg-navy-claro/20 shadow-sutil'
                    : 'border-borda dark:border-borda-dark bg-superficie dark:bg-navy/50 hover:border-borda-forte dark:hover:border-borda'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-primaria text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--color-texto-forte)] dark:text-white">Modo Escuro</h4>
                  <p className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark mt-1 leading-relaxed">
                    Tons escuros e sofisticados, ideal para redução do cansaço visual noturno.
                  </p>
                </div>
                {/* Visual miniature */}
                <div className="mt-4 p-2 rounded-[var(--radius-controle)] bg-fundo-sutil border border-borda flex flex-col gap-1.5 pointer-events-none">
                  <div className="h-2 w-12 bg-fundo-sutil rounded-xs"></div>
                  <div className="h-3 w-full bg-fundo-sutil rounded-xs border border-borda flex items-center px-1">
                    <div className="h-1.5 w-6 bg-primaria-suave0 rounded-2xs"></div>
                  </div>
                </div>
              </button>

              {/* Option 3: Automático / Sistema */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-4 rounded-[var(--radius-card)] border-2 text-left transition-all relative flex flex-col justify-between ${
                  theme === 'system'
                    ? 'border-primaria bg-primaria-suave/20 dark:bg-navy-claro/20 shadow-sutil'
                    : 'border-borda dark:border-borda-dark bg-superficie dark:bg-navy/50 hover:border-borda-forte dark:hover:border-borda'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    {theme === 'system' && (
                      <span className="w-5 h-5 rounded-full bg-primaria text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--color-texto-forte)] dark:text-white">Sincronizar com Sistema</h4>
                  <p className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark mt-1 leading-relaxed">
                    Alterna automaticamente com base na preferência configurada no seu SO (Windows, macOS, Linux).
                  </p>
                </div>
                {/* Visual miniature split */}
                <div className="mt-4 p-2 rounded-[var(--radius-controle)] bg-gradient-to-r from-borda to-borda border border-borda dark:border-borda-dark flex flex-col gap-1.5 pointer-events-none">
                  <div className="h-2 w-12 bg-fundo-sutil dark:bg-fundo-sutil0 rounded-xs"></div>
                  <div className="h-3 w-full bg-gradient-to-r from-white to-borda rounded-xs border border-borda-forte dark:border-borda-dark flex items-center px-1">
                    <div className="h-1.5 w-6 bg-primaria-suave0 rounded-2xs"></div>
                  </div>
                </div>
              </button>
            </div>

            <div className="p-3 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-navy/60 border border-borda dark:border-borda-dark text-[11px] text-texto-medio dark:text-texto-medio-dark flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sucesso-suave0"></span>
                <span>
                  Status Atual: <strong>{theme === 'system' ? 'Modo Automático' : theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</strong>
                  {theme === 'system' && ` (Renderizando como ${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'})`}
                </span>
              </div>
              <span className="text-[10px] text-texto-medio dark:text-texto-medio-dark">Preferência salva localmente</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'empresa' && (
        <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-[var(--color-borda)] dark:border-borda-dark shadow-sutil max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-[var(--color-texto-forte)] dark:text-white">Dados Cadastrais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--color-texto-medio)] dark:text-texto-medio-dark mb-1">Razão Social</label>
              <input
                type="text"
                disabled
                value="Aurora Studio Ltda."
                className="w-full p-2 bg-[var(--color-fundo-sutil)] dark:bg-navy border border-[var(--color-borda)] dark:border-borda-dark text-[var(--color-texto-forte)] dark:text-texto-medio-dark rounded-[var(--radius-controle)] font-medium"
              />
            </div>
            <div>
              <label className="block text-[var(--color-texto-medio)] dark:text-texto-medio-dark mb-1">CNPJ</label>
              <input
                type="text"
                disabled
                value="12.345.678/0001-90"
                className="w-full p-2 bg-[var(--color-fundo-sutil)] dark:bg-navy border border-[var(--color-borda)] dark:border-borda-dark text-[var(--color-texto-forte)] dark:text-texto-medio-dark rounded-[var(--radius-controle)] font-medium"
              />
            </div>
            <div>
              <label className="block text-[var(--color-texto-medio)] dark:text-texto-medio-dark mb-1">Município de Emissão</label>
              <input
                type="text"
                disabled
                value="São Paulo / SP"
                className="w-full p-2 bg-[var(--color-fundo-sutil)] dark:bg-navy border border-[var(--color-borda)] dark:border-borda-dark text-[var(--color-texto-forte)] dark:text-texto-medio-dark rounded-[var(--radius-controle)] font-medium"
              />
            </div>
            <div>
              <label className="block text-[var(--color-texto-medio)] dark:text-texto-medio-dark mb-1">Regime Tributário</label>
              <input
                type="text"
                disabled
                value="Simples Nacional (Anexo III)"
                className="w-full p-2 bg-[var(--color-fundo-sutil)] dark:bg-navy border border-[var(--color-borda)] dark:border-borda-dark text-[var(--color-texto-forte)] dark:text-texto-medio-dark rounded-[var(--radius-controle)] font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-[var(--color-borda)] dark:border-borda-dark shadow-sutil max-w-2xl space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--color-texto-forte)] dark:text-white">Membros e Níveis de Acesso</h3>
            <button className="px-3 py-1.5 bg-[var(--color-primaria)] text-white rounded-[var(--radius-controle)] text-xs font-semibold hover:bg-[#4a4bd6] transition-colors">
              + Convidar Usuário
            </button>
          </div>

          <div className="divide-y divide-[var(--color-borda)] dark:divide-slate-700">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[var(--color-texto-forte)] dark:text-white">Rafael Nogueira</div>
                <div className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark">rafael@aurorastudio.exemplo</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF0FD] dark:bg-navy-claro/50 text-[var(--color-primaria)] dark:text-primaria-clara">
                Proprietário / Admin
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[var(--color-texto-forte)] dark:text-white">Helena Duarte</div>
                <div className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark">helena@aurorastudio.exemplo</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sucesso-suave dark:bg-superficie-dark/50 text-sucesso dark:text-texto-forte-dark">
                Comercial & Operação
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[var(--color-texto-forte)] dark:text-white">Escritório Fiscal & Contábil</div>
                <div className="text-[11px] text-[var(--color-texto-medio)] dark:text-texto-medio-dark">contador@contabilidade.com.br</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-alerta-suave dark:bg-superficie-dark/50 text-alerta dark:text-texto-forte-dark">
                Acesso Contador (Somente Leitura)
              </span>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'fiscal' || activeTab === 'api') && (
        <div className="bg-superficie dark:bg-superficie-dark p-6 rounded-[var(--radius-card)] border border-[var(--color-borda)] dark:border-borda-dark shadow-sutil max-w-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-sucesso dark:text-texto-forte-dark font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Modo demonstração ativo</span>
          </div>
          <p className="text-[var(--color-texto-medio)] dark:text-texto-medio-dark">
            Não há chaves de API, credenciais ou webhooks externos configurados nesta edição de estudo.
          </p>
        </div>
      )}
    </div>
  );
};
