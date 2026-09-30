import React, { useState } from 'react';
import { Repeat, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScopeSerie } from '../../types';

export const ScopeDialog: React.FC = () => {
  const { scopeDialog, fecharScopeDialog, executarAcaoSerie } = useApp();
  const [selectedScope, setSelectedScope] = useState<ScopeSerie>('somente_esta');

  if (!scopeDialog.aberto || !scopeDialog.lancamento) return null;

  const acaoTexto = scopeDialog.acao === 'excluir' ? 'exclusão' : 'edição';
  const botaoTexto = scopeDialog.acao === 'excluir' ? 'Excluir' : 'Aplicar alterações';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-alerta-suave dark:bg-superficie-dark/60 text-alerta dark:text-texto-forte-dark flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-texto-medio dark:text-texto-medio-dark">
                Item de série recorrente
              </h3>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                {scopeDialog.lancamento.descricao}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fecharScopeDialog}
            className="text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio p-1 rounded-[var(--radius-controle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-texto-medio dark:text-texto-medio-dark">
          Este lançamento faz parte de uma série recorrente ou parcelada. Qual é o escopo desta {acaoTexto}?
        </p>

        <div className="space-y-2.5 pt-1">
          <label
            onClick={() => setSelectedScope('somente_esta')}
            className={`flex items-start gap-3 p-3 rounded-[var(--radius-card)] border cursor-pointer transition-all ${
              selectedScope === 'somente_esta'
                ? 'border-primaria bg-primaria-suave/50 dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara'
                : 'border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50'
            }`}
          >
            <input
              type="radio"
              name="scope"
              checked={selectedScope === 'somente_esta'}
              onChange={() => setSelectedScope('somente_esta')}
              className="mt-0.5 text-primaria focus:ring-primaria"
            />
            <div>
              <p className="text-sm font-medium">Somente esta ocorrência</p>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                As outras ocorrências da série permanecerão inalteradas.
              </p>
            </div>
          </label>

          <label
            onClick={() => setSelectedScope('esta_e_proximas')}
            className={`flex items-start gap-3 p-3 rounded-[var(--radius-card)] border cursor-pointer transition-all ${
              selectedScope === 'esta_e_proximas'
                ? 'border-primaria bg-primaria-suave/50 dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara'
                : 'border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50'
            }`}
          >
            <input
              type="radio"
              name="scope"
              checked={selectedScope === 'esta_e_proximas'}
              onChange={() => setSelectedScope('esta_e_proximas')}
              className="mt-0.5 text-primaria focus:ring-primaria"
            />
            <div>
              <p className="text-sm font-medium">Esta e todas as próximas ocorrências</p>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                Lançamentos passados não serão alterados.
              </p>
            </div>
          </label>

          <label
            onClick={() => setSelectedScope('todas')}
            className={`flex items-start gap-3 p-3 rounded-[var(--radius-card)] border cursor-pointer transition-all ${
              selectedScope === 'todas'
                ? 'border-primaria bg-primaria-suave/50 dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara'
                : 'border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50'
            }`}
          >
            <input
              type="radio"
              name="scope"
              checked={selectedScope === 'todas'}
              onChange={() => setSelectedScope('todas')}
              className="mt-0.5 text-primaria focus:ring-primaria"
            />
            <div>
              <p className="text-sm font-medium">Todas as ocorrências da série</p>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                Aplica a alteração em todo o histórico e futuro desta série.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={fecharScopeDialog}
            className="px-4 py-2 text-sm font-medium text-texto-medio dark:text-texto-medio-dark bg-fundo-sutil dark:bg-superficie-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => executarAcaoSerie(selectedScope)}
            className={`px-4 py-2 text-sm font-medium text-white rounded-[var(--radius-controle)] transition-colors cursor-pointer ${
              scopeDialog.acao === 'excluir'
                ? 'bg-perigo-suave hover:bg-perigo-suave'
                : 'bg-primaria hover:bg-primaria-hover'
            }`}
          >
            {botaoTexto}
          </button>
        </div>
      </div>
    </div>
  );
};
