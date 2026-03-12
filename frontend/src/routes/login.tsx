import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api/auth'
import { useAuthStore } from '../store/authStore'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      setAuth(res.data.access_token, res.data.user)
      toast.success('Welcome back!')
      navigate({ to: '/' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Login failed')
    },
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 p-4">
      <div className="w-full max-w-md bg-surface-2 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-display font-bold mb-2 text-center bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-text-muted text-center mb-8 font-body">
          Continue your AI-powered learning journey.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-3 border border-white/5 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-3 border border-white/5 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300" 
              required 
            />
          </div>
          <button 
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-display font-bold hover:shadow-[0_0_20px_rgba(108,59,255,0.4)] transition-all duration-300 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-text-muted font-body">
          Don't have an account? {' '}
          <Link to="/register" className="text-brand-secondary hover:underline font-semibold">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  )
}
