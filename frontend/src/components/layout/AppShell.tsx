import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuthStore()
  const routerState = useRouterState()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/generate', label: 'Generate' },
    { to: '/topics', label: 'Topics' },
    { to: '/my-courses', label: 'Library' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return routerState.location.pathname === '/'
    return routerState.location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col font-body text-text-primary">
      <header className="h-20 backdrop-blur-xl bg-surface-2/80 border-b border-white/5 flex items-center px-6 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center font-display font-extrabold text-white text-xl shadow-lg group-hover:shadow-brand-primary/20 transition-all">
              CM
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
              CodeMentor <span className="text-brand-primary text-2xl">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 ml-12">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className="relative text-sm font-medium text-text-muted hover:text-text-primary transition-colors py-2"
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary shadow-[0_0_8px_rgba(108,59,255,0.6)]"
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated() ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-6 h-6 bg-brand-secondary/20 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-brand-secondary" />
                  </div>
                  <span className="text-xs font-medium text-text-muted truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2.5 bg-surface-3 border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-text-muted hover:text-red-400 group"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="text-sm font-semibold px-5 py-2.5 text-text-primary hover:text-brand-primary transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm font-bold px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:shadow-[0_0_15px_rgba(108,59,255,0.4)] transition-all"
                >
                  Join Free
                </Link>
              </div>
            )}
            
            <button 
              className="md:hidden p-2 text-text-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-x-0 top-20 bg-surface-2 border-b border-white/5 p-6 z-40 shadow-2xl"
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium p-2 hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="py-12 border-t border-white/5 bg-surface-2">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-display font-bold text-brand-primary">
              CM
            </div>
            <span className="font-display font-bold text-lg">CodeMentor AI</span>
          </div>
          
          <p className="text-sm text-text-muted text-center font-body">
            &copy; 2026 CodeMentor AI. Built with Gemini AI & TanStack.
          </p>
          
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Support'].map(item => (
              <a key={item} href="#" className="text-xs text-text-muted hover:text-brand-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
