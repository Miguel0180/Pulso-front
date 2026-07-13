"use client";

import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-border bg-bg-card p-7">
        <h1 className="text-[20px] font-semibold text-text-primary">Entrar na sua conta</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Acesse o painel de gestão de riscos psicossociais da sua empresa.
        </p>

        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-[12.5px] font-medium text-text-secondary">E-mail</span>
            <div className="relative mt-1.5">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                placeholder="voce@empresa.com"
                className="focus-ring w-full rounded-lg border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-[13.5px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-text-secondary">Senha</span>
              <Link href="#" className="text-[12px] text-accent hover:text-accent-hover">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                placeholder="••••••••"
                className="focus-ring w-full rounded-lg border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-[13.5px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          </label>

          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border accent-[var(--color-accent)]" />
            Manter conectado por 30 dias
          </label>

          <Link
            href="/dashboard"
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-[13.5px] font-medium text-white hover:bg-accent-hover"
          >
            Entrar <ArrowRight size={15} />
          </Link>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Ainda não tem uma conta?{" "}
        <Link href="/cadastro" className="font-medium text-accent hover:text-accent-hover">
          Cadastre-se
        </Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-text-secondary">
        Quer criar ou entrar em uma empresa?{" "}
        <Link href="/" className="font-medium text-accent hover:text-accent-hover">
          Voltar ao início
        </Link>
      </p>
    </AuthShell>
  );
}
