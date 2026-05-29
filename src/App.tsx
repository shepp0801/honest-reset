import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DailyPlannerPage } from './pages/DailyPlannerPage'
import { LabValuesPage } from './pages/LabValuesPage'
import { MedsSupplementsPage } from './pages/MedsSupplementsPage'
import { GoalsPage } from './pages/GoalsPage'
import { WeeklyCheckinPage } from './pages/WeeklyCheckinPage'
import { TrustPage } from './pages/TrustPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DailyPlannerPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="check-in" element={<WeeklyCheckinPage />} />
                <Route path="labs" element={<LabValuesPage />} />
                <Route path="meds" element={<MedsSupplementsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="trust" element={<TrustPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
