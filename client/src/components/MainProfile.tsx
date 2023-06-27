import { useState } from "react"
import { UserProfile } from "../interfaces/Profile"
import { Edit } from "./Edit"
import "../styles/pages/Profile.css"

interface PropTypes extends UserProfile {
  updateContactFunc: (arg: { text: string }) => Promise<void>,
  updateBioFunc: (arg: { text: string }) => Promise<void>
}

export default function MainProfile(props: PropTypes) {
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)


  function updateEditingContact() {
    setIsEditingContact(prevEditing => !prevEditing)
  }

  function updateEditingBio() {
    setIsEditingBio(prevEditing => !prevEditing)
  }

  async function updateContact(data: { text: string }) {
    await props.updateContactFunc(data)
    setIsEditingContact(false)
  }

  async function updateBio(data: { text: string }) {
    await props.updateBioFunc(data)
    setIsEditingBio(false)
  }

  function createEditable() {

    return (
      <>
        {isEditingContact ?
          <Edit
            text={props.contact}
            updateFunc={updateContact}
            width={'200px'}
            height={'20px'}
          />
          :
          <h3>Contact: <p className="mainprofile--contact-text">{props.contact}</p></h3>}
        <p className="mainprofile--edit" onClick={updateEditingContact}>
          {isEditingContact ? "Cancel" : "Edit"}
        </p>

        {isEditingBio ?
          <Edit
            text={props.bio}
            updateFunc={updateBio}
          />
          :
          <h3>Bio: <p className="mainprofile--bio-text">{props.bio}</p></h3>
        }
        <p className="mainprofile--edit" onClick={updateEditingBio}>
          {isEditingBio ? "Cancel" : "Edit"}
        </p>
      </>
    )
  }

  return (
    <div className="mainprofile--container">
      <h1 className="mainprofile--username">{props.username}'s Profile</h1>
      <div className="mainprofile--content">
        {
          props.canModify ? createEditable() :
            <>
              {props.contact && <h3>Contact: <p className="mainprofile--contact-text">{props.contact}</p></h3>}
              {props.bio && <h3>Bio: <p className="mainprofile--bio-text">{props.bio}</p></h3>}
            </>
        }
        <h3>Total Posts: {props.posts.length}</h3>
        <h3>Total Likes: {props.likes.length}</h3>
      </div>
    </div>
  )
}