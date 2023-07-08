import { useState } from 'react'
import '../styles/pages/CreatePost.css'
import Tags from '../components/Tags'
import { genres } from "../genreData.json"
import { MsgErr } from '../interfaces/Error'
import Errors from '../components/Error'

interface Form {
  title: string,
  desc: string,
  audio: string,
  audioSize: number
}

export default function CreatePost() {

  const [formData, setFormData] = useState<Form>({
    title: "",
    desc: "",
    audio: "",
    audioSize: 0
  })
  const [allTags, setAllTags] = useState<{ tags: string[] }>({ tags: [] })

  const [errors, setErrors] = useState(false)

  const [serverErrors, setServerErrors] = useState<MsgErr>([])

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

    const generatedTags = genres.reduce((prev, [genre]) => {
      const isInside = allTags.tags.find((tag) => tag === genre)
      return {
        ...prev,
        [genre]: isInside ? true : false
      }
    }, {})

    const finalFormData = {
      ...formData,
      tags: generatedTags
    }

    const res = await fetch('http://localhost:3000/post/create', {
      method: 'POST',
      'credentials': 'include',
      body: JSON.stringify(finalFormData),
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
          className='createpost--form-desc'
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

        <div className='createpost--form-tags'>
          <h5>Tags:</h5>
          <div className='createpost--all-tags'>
            <Tags
              style=""
              tags={allTags.tags}
              updateTag={setAllTags}
            />
          </div>
        </div>

        <Errors
          errors={serverErrors}
        />

        <button className='button--submit'>Create Post</button>

      </form>
    </div>
  )
}