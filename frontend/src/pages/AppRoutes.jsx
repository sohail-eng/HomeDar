import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { ScrollToTop } from '../components/common'
import ProductList from './ProductList'
import ProductDetail from './ProductDetail'
import ContactUs from './ContactUs'
import Favorites from './Favorites'
import Login from './Login'
import Signup from './Signup'
import ForgotPassword from './ForgotPassword'
import ProfilePage from './Profile'
import NotFound from './NotFound'

function AppRoutes() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default AppRoutes

