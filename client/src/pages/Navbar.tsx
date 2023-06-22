import { Link } from 'react-router-dom'
import '../styles/Navbar.css'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export default function Navbar() {
  const { isLoggedIn } = useContext(AuthContext)
  console.log(isLoggedIn)

  function openHome() {
    window.open('http://localhost:5173/')
  }

  async function logout() {
    const res = await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      'credentials': 'include',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      })
    })

    if (res.ok) {
      window.open('http://localhost:5173/login', '_self')
    }
  }

  return (
    <div className='navbar--container'>
      <Link to="/">Review Your Music</Link>

      <div className='navbar--links'>
        {
          isLoggedIn ? <button onClick={logout}>Logout</button>
            : <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
        }
      </div>
    </div>
  )
}