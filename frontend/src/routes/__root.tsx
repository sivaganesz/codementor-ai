import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '../components/layout/AppShell'
import { GlobalChatbot } from '../components/chatbot/GlobalChatbot'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
      <GlobalChatbot />
    </AppShell>
  ),
})
