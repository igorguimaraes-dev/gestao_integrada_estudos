import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirm, categorias } = useApp();
  const [categoriaDestinoId, setCategoriaDestinoId] = useState<string>('');

  if (!confirmDialog.aberto) return null;

  const handleConfirm = () => {
    if (confirmDialog.selectCategoriaDestino) {
      if (!categoriaDestinoId) return;
      if (confirmDialog.onConfirmComDestino) {
        confirmDialog.onConfirmComDestino(categoriaDestinoId);
      }
    } else {
      confirmDialog.onConfirm();
    }
    closeConfirm();
  };

  const categoriasDisponiveis = categorias.filter(
    (c) => c.id !== confirmDialog.categoriaOrigemId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmDialog.perigo
                  ? 'bg-perigo-suave dark:bg-superficie-dark/60 text-perigo dark:text-texto-forte-dark'
                  : 'bg-primaria-suave dark:bg-navy-claro/60 text-primaria dark:text-primaria-clara'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-texto-medio dark:text-texto-medio-dark">
              {confirmDialog.titulo}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeConfirm}
            className="text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio p-1 rounded-[var(--radius-controle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-texto-medio dark:text-texto-medio-dark leading-relaxed">
          {confirmDialog.mensagem}
        </p>

        {confirmDialog.selectCategoriaDestino && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">
              Categoria de destino para os lançamentos:
            </label>
            <select
              value={categoriaDestinoId}
              onChange={(e) => setCategoriaDestinoId(e.target.value)}
              className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              required
            >
              <option value="">Selecione uma categoria...</option>
              {categoriasDisponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.grupo} &gt; {c.subcategoria}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-sm font-medium text-texto-medio dark:text-texto-medio-dark bg-fundo-sutil dark:bg-superficie-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors cursor-pointer"
          >
            {confirmDialog.cancelTexto || 'Cancelar'}
          </button>
          <button
            type="button"
            disabled={confirmDialog.selectCategoriaDestino && !categoriaDestinoId}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-[var(--radius-controle)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              confirmDialog.perigo
                ? 'bg-perigo-suave hover:bg-perigo-suave'
                : 'bg-primaria hover:bg-primaria-hover'
            }`}
          >
            {confirmDialog.confirmTexto || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
