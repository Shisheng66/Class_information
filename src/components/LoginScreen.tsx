import { GraduationCap, Lock, Server, User } from 'lucide-react';
import type { FormEvent } from 'react';

interface LoginScreenProps {
  username: string;
  password: string;
  rememberMe: boolean;
  error: string;
  isSubmitting: boolean;
  backendStatus: 'checking' | 'online' | 'offline';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (checked: boolean) => void;
}

const TEXT = {
  backendOnline: '\u540e\u7aef\u670d\u52a1\u5728\u7ebf',
  backendOffline: '\u540e\u7aef\u670d\u52a1\u672a\u8fde\u63a5',
  backendChecking: '\u6b63\u5728\u68c0\u67e5\u540e\u7aef\u72b6\u6001',
  title: '\u73ed\u7ea7\u4fe1\u606f\u7ba1\u7406\u5e73\u53f0',
  description:
    '\u5f53\u524d\u7248\u672c\u5df2\u4ece\u201c\u6d4f\u89c8\u5668\u672c\u5730\u5b58\u50a8\u201d\u5347\u7ea7\u4e3a\u201cReact \u524d\u7aef + Python FastAPI + SQLite \u6570\u636e\u5e93\u201d\u7684\u524d\u540e\u7aef\u7ed3\u6784\uff0c\u65b9\u4fbf\u540e\u7eed\u6269\u5c55\u771f\u5b9e\u8d26\u53f7\u4f53\u7cfb\u3001\u63a5\u53e3\u6743\u9650\u548c\u6570\u636e\u5907\u4efd\u3002',
  defaultUsername: '\u9ed8\u8ba4\u8d26\u53f7',
  defaultPassword: '\u9ed8\u8ba4\u5bc6\u7801',
  loginTitle: '\u7ba1\u7406\u5458\u767b\u5f55',
  loginDescription:
    '\u767b\u5f55\u540e\u53ef\u67e5\u770b\u7edf\u8ba1\u770b\u677f\u3001\u7ef4\u62a4\u5b66\u751f\u4fe1\u606f\uff0c\u5e76\u5c06\u5bfc\u5165\u6570\u636e\u5199\u5165 SQLite \u6570\u636e\u5e93\u3002',
  username: '\u7528\u6237\u540d',
  password: '\u5bc6\u7801',
  usernamePlaceholder: '\u8bf7\u8f93\u5165\u7ba1\u7406\u5458\u7528\u6237\u540d',
  passwordPlaceholder: '\u8bf7\u8f93\u5165\u767b\u5f55\u5bc6\u7801',
  remember: '\u8bb0\u4f4f\u5f53\u524d\u767b\u5f55\u72b6\u6001',
  loggingIn: '\u767b\u5f55\u4e2d...',
  loginButton: '\u767b\u5f55\u7cfb\u7edf',
};

export function LoginScreen({
  username,
  password,
  rememberMe,
  error,
  isSubmitting,
  backendStatus,
  onSubmit,
  onUsernameChange,
  onPasswordChange,
  onRememberMeChange,
}: LoginScreenProps) {
  const backendLabel =
    backendStatus === 'online'
      ? TEXT.backendOnline
      : backendStatus === 'offline'
        ? TEXT.backendOffline
        : TEXT.backendChecking;

  const backendTone =
    backendStatus === 'online'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : backendStatus === 'offline'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{TEXT.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-blue-50">{TEXT.description}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-medium text-blue-100">{TEXT.defaultUsername}</p>
              <p className="mt-2 text-xl font-semibold">admin</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-medium text-blue-100">{TEXT.defaultPassword}</p>
              <p className="mt-2 text-xl font-semibold">admin123</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${backendTone}`}
            >
              <Server className="h-3.5 w-3.5" />
              {backendLabel}
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">{TEXT.loginTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{TEXT.loginDescription}</p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.username}</span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => onUsernameChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder={TEXT.usernamePlaceholder}
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.password}</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder={TEXT.passwordPlaceholder}
                  required
                />
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => onRememberMeChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {TEXT.remember}
            </label>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? TEXT.loggingIn : TEXT.loginButton}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
