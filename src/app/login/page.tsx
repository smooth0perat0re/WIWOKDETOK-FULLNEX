"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { LogIn, Loader2, Command } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.post('/login', { username, password })
      
      if (response.data && response.data.token) {
        setAuth(response.data.token, response.data.user)
        toast.success('Welcome back!')
        router.push('/workspaces')
      }
    } catch (err: any) {
      // Error handling is mostly done globally in api.ts interceptor,
      // but we can add specific handling if needed.
      // toast.error is already handled by interceptor for 401
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-2xl relative z-10 border border-[var(--border-subtle)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Command className="w-6 h-6 text-white dark:text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Log in to WIWOKDETOK</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Username / NIP / NIM</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
              placeholder="Enter your credential"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <a href="#" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 px-4 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account? <a href="#" className="text-[var(--text-primary)] font-medium hover:underline">Sign up</a>
        </div>
      </div>
    </div>
  )
}
