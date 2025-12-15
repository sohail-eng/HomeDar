import Header from './Header'
import Footer from './Footer'

/**
 * Layout component that wraps Header, Footer, and page content
 */
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 container-custom py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
