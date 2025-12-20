import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import ProductList from './ProductList'
import ProductDetail from './ProductDetail'
import ContactUs from './ContactUs'
import Favorites from './Favorites'
import NotFound from './NotFound'

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default AppRoutes

