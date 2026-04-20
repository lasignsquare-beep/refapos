'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { validateCredentials, setSession, getSession, initStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function boot() {
      await initStore()
      if (getSession()) router.replace('/')
      else setReady(true)
    }
    boot()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const user = await validateCredentials(username.trim(), password)
    if (!user) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }
    setSession(user)
    router.replace('/')
  }

  if (!ready) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Dot-grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Header band */}
          <div className="bg-gradient-to-r from-red-700 to-red-600 px-8 pt-8 pb-7">
            <div className="flex flex-col items-center mb-1">
              <img src="/dark.png" alt="Refabit Logo" className="h-10 sm:h-12 w-auto object-contain mb-2 max-w-full" />
              <div>
                <p className="text-center text-red-200 text-xs sm:text-sm">Point of Sale System</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white px-8 py-8">
            <h2 className="text-slate-800 font-bold text-2xl mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your account to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm mt-2"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>


          </div>
        </div>

        <p className="text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()}. Refabit Technologies.
          <a
            href="https://jamin-kairu.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-primary-foreground/60 hover:text-accent transition-colors"
          >
            𓃵
          </a>
        </p>
      </div>
    </div>
  )
}
