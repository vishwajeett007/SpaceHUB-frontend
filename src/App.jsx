import './App.css'
import { BrowserRouter as Router } from 'react-router-dom'
import { AppErrorBoundary, AuthProvider } from './shared'
import AppRoutes from './app/routing/AppRoutes'
import TopToast from './shared/components/TopToast'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="animate-fade-in">
          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            <TopToast />
            <AppErrorBoundary>
              <AppRoutes />
            </AppErrorBoundary>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
