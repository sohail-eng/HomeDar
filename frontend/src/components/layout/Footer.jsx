import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer style={{ padding: '2rem', backgroundColor: '#333', color: '#fff', textAlign: 'center' }}>
      <p>&copy; 2025 HomeDar. All rights reserved.</p>
      <Link to="/contact" style={{ color: '#fff', textDecoration: 'underline' }}>Contact Us</Link>
    </footer>
  )
}

export default Footer

