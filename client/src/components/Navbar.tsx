import { Link } from 'react-router-dom'
import '../styles/components/Navbar.css'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export default function Navbar() {
  const { isLoggedIn, userData } = useContext(AuthContext)

  async function logout() {
    const res = await fetch('https://rymelody-backend.onrender.com/auth/logout', {
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
          <Link to="/post/create" className='navbar--create-post'>Create New Post</Link>
        }
      </div>


      <div className='navbar--links'>
        {
          isLoggedIn ?
            <>
              <Link className='navbar--username' to={`/user/${userData?.id}`}>
                {userData?.username}
              </Link>
              <button className='navbar--logout' onClick={logout}>Logout</button>
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