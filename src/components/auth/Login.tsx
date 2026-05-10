import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await signInWithEmail(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Sahasra</h1>
        <p className="text-slate-400 mb-8">Weight tracker</p>

        {sent ? (
          <div className="bg-surface-800 rounded-xl p-6 text-center">
            <p className="text-white font-semibold mb-2">Check your email</p>
            <p className="text-slate-400 text-sm">We sent a magic link to <span className="text-white">{email}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors"
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
