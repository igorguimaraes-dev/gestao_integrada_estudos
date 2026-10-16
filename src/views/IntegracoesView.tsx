import React from 'react';
import { ShieldCheck, Database, Unplug } from 'lucide-react';
import type { Integration } from '../types';

interface IntegracoesViewProps {
  integrations: Integration[];
  onTriggerActionToast: (msg: string) => void;
}

export const IntegracoesView: React.FC<IntegracoesViewProps> = () => (
  <main className="space-y-6 p-6 text-texto-forte dark:text-texto-forte-dark">
    <div>
      <h1 className="text-2xl font-bold">Ambiente demonstrativo</h1>
      <p className="mt-2 text-sm text-texto-medio">Projeto para entrevista com clientes, contratos e valores inteiramente fictícios.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { Icon: Database, title: 'Dados locais', description: 'Cadastros, lançamentos e extratos de exemplo ficam salvos neste navegador.' },
        { Icon: Unplug, title: 'Asaas desconectado', description: 'A integração API foi removida. Nenhuma chave, webhook ou conta externa é utilizada.' },
        { Icon: ShieldCheck, title: 'Cobranças simuladas', description: 'Pix, boletos e notas fiscais são apenas exemplos, sem emissão ou envio real.' },
      ].map(({ Icon, title, description }) => (
        <section key={title} className="rounded-2xl border border-borda bg-superficie p-6 dark:border-borda-dark dark:bg-superficie-dark">
          <Icon className="mb-4 h-6 w-6 text-primaria" />
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-texto-medio">{description}</p>
        </section>
      ))}
    </div>
  </main>
);
