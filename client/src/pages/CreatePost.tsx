import { useState } from 'react'
import '../styles/pages/CreatePost.css'
export default function CreatePost() {

  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    audio: "",
    audioSize: 0
  })

  const [errors, setErrors] = useState(false)

  const [serverErrors, setServerErrors] = useState<{ message: string }[]>([])

  function updateForm(e: React.SyntheticEvent) {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => {
      return {
        ...oldFormData,
        [name]: value
      }
    })
  }

  function updateFile(e: React.SyntheticEvent) {
    const { files } = e.target as HTMLInputElement
    if (files !== null && files.length > 0) {
      const reader = new FileReader()
      reader.readAsDataURL(files[0])
      reader.onload = () => {
        const newResult = reader.result
        let newRes: string
        if (typeof newResult === 'string') {
          newRes = newResult
        }
        else {
          setErrors(true)
          return
        }

        setErrors(false)

        setFormData(oldFormData => {
          return {
            ...oldFormData,
            audio: newRes,
            audioSize: files[0].size
          }
        })

      }
    }
    else {
      setFormData(oldFormData => {
        return {
          ...oldFormData,
          audio: "",
          audioSize: 0
        }
      })
    }
  }

  async function submitForm(e: React.SyntheticEvent) {
    e.preventDefault()

    const res = await fetch('http://localhost:3000/post/create', {
      method: 'POST',
      'credentials': 'include',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      if (res.status === 413) {
        setServerErrors([{ message: 'Audio File Must Be At Most 1MB' }])
        return
      }
      const errs = await res.json()
      setServerErrors(errs)
    }
    else {
      window.open('http://localhost:5173/', '_self')
    }
  }

  const serverErrorElements = serverErrors.map((elem, i) => {
    return <li key={i}>{elem.message}</li>
  })

  return (
    <div className="createpost--container">
      <h1 className='createpost--title'>Create Post</h1>
      <form onSubmit={submitForm} className='createpost--form'>
        <input
          type="text"
          name="title"
          placeholder="Title"
          onChange={updateForm}
          value={formData.title}
        />

        <textarea
          name="desc"
          placeholder="Description"
          onChange={updateForm}
          value={formData.desc}
        />

        <div className='createpost--form-file'>
          <input
            type="file"
            name="audio"
            onChange={updateFile}
            accept='audio/*'
          />
          {errors && <h3>There was an error uploading this file, please try again</h3>}
        </div>

        <ul>
          {serverErrorElements}
        </ul>

        <button>Create Post</button>

      </form>
    </div>
  )
}