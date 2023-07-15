import { createContext, useEffect, useState } from "react"

interface User {
  id: number,
  username: string,
  email: string,
  password: string
}

const AuthContext =
  createContext<{ isLoggedIn: boolean, userData: User | undefined }>({
    isLoggedIn: false,
    userData: undefined
  })

export default AuthContext

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState()

  useEffect(() => {
    fetch('https://rymelody-backend.onrender.com/auth/authenticate', {
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