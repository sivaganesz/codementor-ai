import React from 'react'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center px-6 sticky top-0 z-50">
        <div className="font-bold text-xl text-indigo-600">CodeMentor AI</div>
        <nav className="ml-10 flex gap-6">
          <a href="/" className="text-sm font-medium hover:text-indigo-600">Home</a>
          <a href="/generate" className="text-sm font-medium hover:text-indigo-600">Generate Course</a>
          <a href="/topics" className="text-sm font-medium hover:text-indigo-600">Topics</a>
          <a href="/my-courses" className="text-sm font-medium hover:text-indigo-600">My Library</a>
        </nav>
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
