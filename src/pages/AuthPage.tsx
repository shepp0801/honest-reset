import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandLogo } from '../components/BrandLogo'
import { DailyQuote } from '../components/DailyQuote'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    const result =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password)

    if (result.error) {
      setError(result.error)
    } else if (mode === 'signup') {
      setSuccess('Account created! Check your email to confirm, or sign in if confirmation is disabled.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 md:p-8">
      <BrandLogo size="lg" />
      <DailyQuote className="w-full max-w-md" />
      <Card className="w-full max-w-md">
        <h2 className="mb-1 font-display text-xl font-semibold text-[var(--color-text)]">
          {mode === 'login' ? 'Welcome back' : 'Start your reset'}
        </h2>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          {mode === 'login' ? 'Sign in to continue tracking' : 'Create your private account'}
        </p>

        <Alert type="error" message={error} onDismiss={() => setError('')} />
        <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setSuccess('')
            }}
            className="font-semibold text-[var(--color-accent)] hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </Card>
    </div>
  )
}
