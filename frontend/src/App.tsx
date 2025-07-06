import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CircleProvider } from './contexts/CircleContext'
import Layout from './components/Layout'
import BoardPage from './pages/BoardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CirclesPage from './pages/CirclesPage'
import CircleDetailPage from './pages/CircleDetailPage'
import InvitationsPage from './pages/InvitationsPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CircleProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/circles" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/circles" element={<CirclesPage />} />
              <Route path="/invitations" element={<InvitationsPage />} />
              <Route path="/circles/:id" element={<CircleDetailPage />} />
              <Route path="/circles/:circleId/tournaments/:tournamentId" element={<BoardPage />} />
            </Routes>
          </Layout>
        </CircleProvider>
      </AuthProvider>
    </Router>
  )
}

export default App