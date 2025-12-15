import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import AppRoutes from './pages/AppRoutes'

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App

