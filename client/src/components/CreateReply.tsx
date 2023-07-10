import { useState } from "react"
import '../styles/components/CreateReply.css'

interface PropTypes {
  updateReply: (arg: { text: string }) => Promise<void>
}

export default function CreateReply(props: PropTypes) {
  const [formDesc, setFormDesc] = useState({
    text: ""
  })

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormDesc(oldFormDesc => ({ ...oldFormDesc, [name]: value }))
  }

  async function submitForm(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()
    await props.updateReply(formDesc)
  }

  return (
    <div className="createreply--container">
      <form onSubmit={submitForm} className="createreply--form">
        <textarea
          name="text"
          className="createreply--form-text"
          value={formDesc.text}
          onChange={updateForm}
        />
        <button className="createreply--post-btn">Reply</button>
      </form>

    </div>
  )
}