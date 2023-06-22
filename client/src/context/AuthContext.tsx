import { createContext, useEffect, useState } from "react"
import axios from "axios"

const AuthContext = createContext({ isLoggedIn: false })

export default AuthContext

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:3000/auth/authenticate', {
      withCredentials: true
    })
      .then(res => {
        if (res.status === 200) {
          setIsLoggedIn(true)
        }
        else {
          setIsLoggedIn(false)
        }
      })
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}