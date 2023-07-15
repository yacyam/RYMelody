import { useState } from "react"
import Errors from '../components/Error'
import '../styles/pages/Register.css'
import '../styles/pages/Login.css'
import { MsgErr } from "../interfaces/Error"

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  const [errors, setErrors] = useState<MsgErr>([])

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => {
      return {
        ...oldFormData,
        [name]: value
      }
    })
    setErrors([])
  }

  async function submitForm(e: React.SyntheticEvent) {
    e.preventDefault()

    const res = await fetch('https://rymelody-backend.onrender.com/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      setErrors([{ message: 'Username Or Password Incorrect, Please Try Again' }])
    }
    else {
      window.open('https://rymelody.netlify.app/', '_self')
    }
  }

  return (
    <div className='register--container'>

      <form onSubmit={submitForm} className='register--form'>
        <legend className='register--legend'>Login</legend>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={updateForm}
        />
        <input
          type="text"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={updateForm}
        />

        <Errors
          errors={errors}
        />
        <button className='register--btn'>Log In</button>

      </form>
    </div>
  )
}