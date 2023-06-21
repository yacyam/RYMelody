import { useEffect, useState } from 'react'
import '../styles/Register.css'

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const [formErrors, setFormErrors] = useState<{ message: string }[]>([])

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(prevFormData => {
      return {
        ...prevFormData,
        [name]: value
      }
    })
  }

  async function submitForm(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()

    console.log(formData)

    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      if (res.status === 400) {
        const errs = await res.json()
        setFormErrors(errs)
      }
      else {
        setFormErrors([{ message: 'Something Went Wrong, Please Try Again' }])
      }
    }
    else {
      window.open('http://localhost:5173/login', '_self')
    }
  }

  const displayErrors = formErrors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })

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

        <ul>
          {displayErrors}
        </ul>
        <button className='register--btn'>Register</button>

      </form>
    </div>
  )
}