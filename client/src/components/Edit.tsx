import { useState } from "react"
import "../styles/components/Edit.css"

interface PropTypes {
  text: string,
  updateFunc: (arg: { text: string }) => Promise<void>,
  width?: string,
  height?: string
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
      <form onSubmit={submitForm} className="edit--form">
        <textarea
          name="text"
          value={formDesc.text}
          onChange={updateForm}
          style={{ width: props.width, height: props.height }}
        />
        <button>Save</button>
      </form>

    </div>
  )
}