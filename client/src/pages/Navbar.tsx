import { Link } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {

  return (
    <div className='navbar--container'>
      <h1>Review Your Music</h1>

      <div className='navbar--links'>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  )
}