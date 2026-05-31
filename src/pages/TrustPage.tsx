import { Navigate } from 'react-router-dom'

/** Legacy route — Privacy & Trust now lives on Settings. */
export function TrustPage() {
  return <Navigate to="/settings" replace />
}
