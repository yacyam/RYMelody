import { Link } from 'react-router-dom'
import '../styles/components/Navbar.css'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import pfp from '../images/default.jpeg'

export default function Navbar() {
  const { isLoggedIn } = useContext(AuthContext)
  console.log(isLoggedIn)

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
      <div className='navbar--left'>
        <Link to="/">Review Your Melody</Link>
        {isLoggedIn &&
          <Link to="/post/create" className='navbar--create-post'>+ Create New Post</Link>
        }
      </div>


      <div className='navbar--links'>
        {
          isLoggedIn ?
            <>
              <img src={pfp} alt="" />
              <button onClick={logout}>Logout</button>
            </>
            : <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
        }
      </div>
    </div>
  )
}