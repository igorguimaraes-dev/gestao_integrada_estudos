import { Braces } from 'lucide-react';
import type { FormEvent } from 'react';
import './login.css';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-page">
      <section className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-card">
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-brand">
          <strong>Gestão Integrada</strong>
          <span>Clientes, contratos e cobranças</span>
        </div>
        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-eyebrow">AMBIENTE DEMONSTRATIVO</span>
        <h1>Bem-vindo de volta</h1>
        <p>Explore a apresentação com dados inteiramente fictícios.</p>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input type="email" name="email" required autoFocus />
          </label>
          <label>
            Senha
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-primary" type="submit">Entrar no sistema</button>
        </form>
        <small>Dados fictícios · Sem conexão com contas reais</small>
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-showcase">
          <span>APRESENTAÇÃO</span>
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-grid">
            <div className="login-integration-logo login-asaas">
              <img src="/logos/asaas.svg" alt="Asaas" width="100" height="24" />
            </div>
            <div className="login-integration-logo login-autentique">
              <img src="/logos/autentique.svg" alt="Autentique" width="30" height="30" />
              <span aria-hidden="true">Autentique</span>
            </div>
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-logo login-api">
              <Braces size={21} aria-hidden="true" />
              <span><strong>API</strong><small>Integramos outros sistemas</small></span>
            </div>
          </div>
        </div>
      </section>
      <aside className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-visual">
        <div>
          <span>GESTÃO INTEGRADA</span>
          <h2>Gestão de clientes, contratos<br />e financeiro.</h2>
          <p>Uma visão clara da sua operação, do relacionamento com o cliente à gestão financeira.</p>
        </div>
      </aside>
    </main>
  );
}
