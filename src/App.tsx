import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/auth/Login'
import { BottomNav } from './components/nav/BottomNav'

function PlaceholderPage({ name }: { name: string }) {
  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold">{name}</h2>
      <p className="text-slate-400 text-sm mt-2">Coming soon…</p>
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-surface-900 pb-20 md:pb-0 md:pt-16">
      <Routes>
        <Route path="/" element={<PlaceholderPage name="Dashboard" />} />
        <Route path="/log-weight" element={<PlaceholderPage name="Log Weight" />} />
        <Route path="/log-training" element={<PlaceholderPage name="Log Training" />} />
        <Route path="/history" element={<PlaceholderPage name="History" />} />
        <Route path="/settings" element={<PlaceholderPage name="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {session ? <AuthenticatedApp /> : <Login />}
    </BrowserRouter>
  )
}
