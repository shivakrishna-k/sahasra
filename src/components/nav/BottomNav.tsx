import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', icon: '📊', label: 'Home' },
  { to: '/log-weight', icon: '⚖️', label: 'Weight' },
  { to: '/log-training', icon: '🥋', label: 'Train' },
  { to: '/history', icon: '📅', label: 'History' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export function BottomNav() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-800 border-t border-surface-700 flex">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-brand-purple' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 bg-surface-800 border-b border-surface-700 px-6 h-16 items-center gap-6">
        <span className="text-white font-bold text-lg mr-4">Sahasra</span>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm transition-colors ${
                isActive ? 'text-brand-purple' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
