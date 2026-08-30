'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
              <path d="M4 17 10 11l4 4 6-7" />
              <path d="M15 5h5v5" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Portfolio</p>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Nor Automates</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
            <p className="mt-0.5 text-sm text-slate-400">Enter the shared passcode to continue.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="passcode" className="block text-sm font-medium text-slate-700">
              Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              autoFocus
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {state.error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
