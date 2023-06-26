import { useState } from "react"
import "../styles/components/Edit.css"

interface PropTypes {
  text: string,
  updateFunc: (arg: { text: string }) => Promise<void>
}

export function Edit(props: PropTypes) {
  const [formDesc, setFormDesc] = useState({
    text: props.text
  })

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormDesc(oldFormDesc => ({ ...oldFormDesc, [name]: value }))
  }

  async function submitForm(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()
    await props.updateFunc(formDesc)
  }

  return (
    <div className="edit--container">
      <form onSubmit={submitForm}>
        <textarea name="text" value={formDesc.text} onChange={updateForm} />
        <button>Save</button>
      </form>

    </div>
  )
}