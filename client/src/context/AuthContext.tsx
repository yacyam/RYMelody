import { createContext, useEffect, useState } from "react"

const AuthContext = createContext({ isLoggedIn: false, userData: {} })

export default AuthContext

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({})

  useEffect(() => {
    fetch('http://localhost:3000/auth/authenticate', {
      method: 'GET',
      'credentials': 'include'
    })
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(true)
        setUserData(data)
      })
      .catch(() => {
        console.log('not logged in')
        setIsLoggedIn(false)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData }}>
      {children}
    </AuthContext.Provider>
  )
}