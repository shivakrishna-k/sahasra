import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/auth/Login'
import { Dashboard } from './components/dashboard/Dashboard'
import { LogWeight } from './components/log/LogWeight'
import { LogTraining } from './components/log/LogTraining'
import { History } from './components/history/History'
import { Settings } from './components/settings/Settings'
import { BottomNav } from './components/nav/BottomNav'

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-surface-900 pb-20 md:pb-0 md:pt-16">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log-weight" element={<LogWeight />} />
        <Route path="/log-training" element={<LogTraining />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { session, loading, signInWithEmail } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {session ? <AuthenticatedApp /> : <Login onSignIn={signInWithEmail} />}
    </BrowserRouter>
  )
}
