import React from 'react'
import { Link } from '@tanstack/react-router'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center px-6 sticky top-0 z-50">
        <Link to="/" className="font-bold text-xl text-indigo-600">CodeMentor AI</Link>
        <nav className="ml-10 flex flex-1 gap-6">
          <Link to="/" className="text-sm font-medium hover:text-indigo-600 [&.active]:text-indigo-600">Home</Link>
          <Link to="/generate" className="text-sm font-medium hover:text-indigo-600 [&.active]:text-indigo-600">Generate Course</Link>
          <Link to="/topics" className="text-sm font-medium hover:text-indigo-600 [&.active]:text-indigo-600">Topics</Link>
          <Link to="/my-courses" className="text-sm font-medium hover:text-indigo-600 [&.active]:text-indigo-600">My Library</Link>
        </nav>
        <div className="flex gap-4">
          <Link to="/login" className="text-sm font-medium px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50">Login</Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8 px-6">
        {children}
      </main>
      <footer className="py-6 border-t bg-white text-center text-sm text-slate-500">
        &copy; 2026 CodeMentor AI. All rights reserved.
      </footer>
    </div>
  )
}
