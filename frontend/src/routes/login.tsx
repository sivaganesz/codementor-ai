import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple placeholder for login logic
    localStorage.setItem('access_token', 'dummy-token')
    window.location.href = '/'
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white border rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Login to CodeMentor AI</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-lg" 
            required 
          />
        </div>
        <button 
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Login
        </button>
      </form>
    </div>
  )
}
