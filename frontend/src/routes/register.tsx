import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api/auth'
import { useAuthStore } from '../store/authStore'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
})

function RegisterComponent() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      setAuth(res.data.access_token, res.data.user)
      toast.success('Account created! Welcome.')
      navigate({ to: '/' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed')
    },
  })

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ email: data.email, password: data.password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 p-4">
      <div className="w-full max-w-md bg-surface-2 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-display font-bold mb-2 text-center bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
          Join CodeMentor AI
        </h1>
        <p className="text-text-muted text-center mb-8 font-body">
          Start your personalized AI learning path today.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
            <input 
              {...register('email')}
              type="email" 
              placeholder="you@example.com"
              className="w-full bg-surface-3 border border-white/5 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300" 
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <input 
              {...register('password')}
              type="password" 
              placeholder="••••••••"
              className="w-full bg-surface-3 border border-white/5 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300" 
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
            <input 
              {...register('confirmPassword')}
              type="password" 
              placeholder="••••••••"
              className="w-full bg-surface-3 border border-white/5 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300" 
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button 
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-display font-bold hover:shadow-[0_0_20px_rgba(108,59,255,0.4)] transition-all duration-300 disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-text-muted font-body">
          Already have an account? {' '}
          <Link to="/login" className="text-brand-secondary hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
