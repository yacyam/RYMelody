import { useState } from 'react'
import '../styles/pages/CreatePost.css'
import Tag from '../components/Tag'
export default function CreatePost() {

  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    audio: "",
    audioSize: 0,
    tags: ["pop"]
  })

  const [errors, setErrors] = useState(false)

  const [serverErrors, setServerErrors] = useState<{ message: string }[]>([])

  const genreAndNameList: [string, string][] =
    [
      ["electronic", "Electronic"],
      ["hiphop", "Hip Hop"],
      ["pop", "Pop"],
      ["rock", "Rock"],
      ["punk", "Punk"],
      ["metal", "Metal"],
      ["jazz", "Jazz"],
      ["classical", "Classical"]
    ]

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

  function updateTag(e: React.SyntheticEvent): void {
    const { name } = e.target as HTMLInputElement

    setFormData(oldFormData => {
      const tagCopy = [...oldFormData.tags]
      const isTagAlready = tagCopy.find((tag) => tag === name)
      let newTags = []
      if (isTagAlready) {
        newTags = tagCopy.filter((tag) => tag !== name)
      } else {
        tagCopy.length === 2 && tagCopy.pop()
        tagCopy.push(name)
        newTags = tagCopy
      }

      return {
        ...oldFormData,
        tags: newTags
      }
    })
  }

  const tagElements = genreAndNameList.map((hold: [string, string]) => {
    const [genre, name] = hold

    const shouldHighlight = formData.tags.find((gen) => gen === genre)

    return <Tag
      genre={genre}
      name={name}
      style={shouldHighlight ? "selected" : "select"}
      updateTag={updateTag}
    />
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

        <div className='createpost--form-tags'>
          <h5>Tags:</h5>
          {tagElements}
        </div>

        <ul>
          {serverErrorElements}
        </ul>

        <button className='button--submit'>Create Post</button>

      </form>
    </div>
  )
}