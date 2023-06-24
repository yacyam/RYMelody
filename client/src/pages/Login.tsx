import { useState } from "react"
import '../styles/Register.css'
import '../styles/Login.css'

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  const [formError, setFormError] = useState(false)

  const [errors, setErrors] = useState<{ message: string }[]>([])

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => {
      return {
        ...oldFormData,
        [name]: value
      }
    })
  }

  async function submitForm(e: React.SyntheticEvent) {
    e.preventDefault()

    if (formData.username === "" || formData.password === "") {
      setFormError(true)
      return
    }
    setFormError(false)

    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      setErrors([{ message: 'Username Or Password Incorrect, Please Try Again' }])
    }
    else {
      window.open('http://localhost:5173/', '_self')
    }
  }

  const displayErrors = errors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })


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

        {formError &&
          <h3 className="login--enter-both">
            Please Enter Both Username and Password</h3>
        }
        {displayErrors}
        <button className='register--btn'>Log In</button>

      </form>
    </div>
  )
}