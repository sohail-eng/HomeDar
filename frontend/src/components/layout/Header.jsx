import { Link } from 'react-router-dom'

function Header() {
  return (
    <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
          HomeDar
        </Link>
        <div>
          <Link to="/" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>Products</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: '#333' }}>Contact Us</Link>
        </div>
      </nav>
    </header>
  )
}

export default Header

