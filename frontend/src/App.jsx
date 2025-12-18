import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import AppRoutes from './pages/AppRoutes'
import { useBrowserLocation } from './hooks/useBrowserLocation'

function App() {
  // Request browser location once on app load and keep it cached in localStorage.
  // This runs globally and is independent of any specific page.
  useBrowserLocation()

  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App

