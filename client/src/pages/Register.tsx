import { useState } from 'react'
import '../styles/pages/Register.css'
import { MsgErr } from '../interfaces/Error'
import Errors from '../components/Error'

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const [formErrors, setFormErrors] = useState<MsgErr>([])

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(prevFormData => {
      return {
        ...prevFormData,
        [name]: value
      }
    })
    setFormErrors([])
  }

  async function submitForm(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()

    const res = await fetch('https://rymelody-backend.onrender.com/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const errs = await res.json()
      setFormErrors(errs)
    }
    else {
      window.open('http://localhost:5173/login', '_self')
    }
  }

  return (
    <div className='register--container'>

      <form onSubmit={submitForm} className='register--form'>
        <legend className='register--legend'>Sign Up</legend>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={updateForm}
        />
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={updateForm}
        />
        <input
          type="text"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={updateForm}
        />
        <input
          type="text"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={updateForm}
        />

        <Errors
          errors={formErrors}
        />
        <button className='register--btn'>Register</button>

      </form>
    </div>
  )
}