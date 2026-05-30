import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { formatDisplayDate, todayISO } from '../../lib/date'
import { BrandLogo } from '../BrandLogo'
import { DailyQuote } from '../DailyQuote'
import { ProfileSwitcher } from './ProfileSwitcher'
import { Button } from '../ui/Button'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/check-in', label: 'Check-in' },
  { to: '/', label: 'Daily Log', end: true },
  { to: '/labs', label: 'Labs' },
  { to: '/meds', label: 'Medications & Supplements' },
  { to: '/goals', label: 'Goals' },
  { to: '/settings', label: 'Settings' },
  { to: '/trust', label: 'Privacy & Trust' },
]

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[var(--color-sage)] text-[var(--color-on-sage)] shadow-sm'
            : 'text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-sage)_14%,transparent)]'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function AppLayout() {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const isPlanner = pathname === '/'
  const isDashboard = pathname === '/dashboard'
  const contentMaxWidth = isDashboard ? 'max-w-6xl' : 'max-w-4xl'
  const today = formatDisplayDate(todayISO())

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 md:sticky md:top-0 md:flex">
        <div className="shrink-0 px-1 text-center">
          <BrandLogo size="nav" className="mx-auto object-center" />
          <p className="mt-2 text-xs leading-snug text-[var(--color-muted)]">
            Honest tracking, daily.
          </p>
        </div>
        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] pt-4">
          <Button variant="ghost" onClick={toggleTheme} className="justify-start">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button variant="secondary" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_92%,transparent)] px-4 py-2 backdrop-blur-md md:py-2">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden w-64 shrink-0 md:block">
              <DailyQuote compact />
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0 shrink-0 md:hidden">
                <BrandLogo size="sm" />
              </div>
              <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
                <ProfileSwitcher />
              </div>
              {!isPlanner && (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    Today
                  </p>
                  <p className="font-display text-sm font-semibold text-[var(--color-text)] md:text-base">
                    {today}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 md:hidden">
                <Button variant="ghost" onClick={toggleTheme} className="px-2">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
                <Button variant="secondary" onClick={() => signOut()} className="px-3 py-1.5 text-xs">
                  Out
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-2 lg:hidden">
            <ProfileSwitcher />
          </div>
          <DailyQuote className="mt-3 md:hidden" />
        </header>

        <main
          className={`mx-auto w-full ${contentMaxWidth} flex-1 p-4 md:py-4 md:pb-4 ${isPlanner ? 'pb-28' : 'pb-24'}`}
        >
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1 shadow-[0_-4px_20px_rgba(85,93,66,0.08)] md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center py-2.5 text-[10px] font-semibold leading-tight sm:text-xs ${
                  isActive ? 'text-[var(--color-sage)]' : 'text-[var(--color-muted)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
