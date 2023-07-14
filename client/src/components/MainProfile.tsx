import { useState } from "react"
import { UserProfile } from "../interfaces/Profile"
import { Edit } from "./Edit"
import Errors from "./Error"
import "../styles/pages/Profile.css"
import { MsgErr } from "../interfaces/Error"

interface PropTypes extends UserProfile {
  updateContactFunc: (arg: { text: string }) => Promise<MsgErr>,
  updateBioFunc: (arg: { text: string }) => Promise<MsgErr>
}

export default function MainProfile(props: PropTypes) {
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [editContactErrors, setEditContactErrors] = useState<MsgErr>([])
  const [editBioErrors, setEditBioErrors] = useState<MsgErr>([])
  const [sendVerificationErrors, setSendVerificationErrors] = useState<MsgErr>([])

  function updateEditingContact() {
    setIsEditingContact(prevEditing => !prevEditing)
    setEditContactErrors([])
  }

  function updateEditingBio() {
    setIsEditingBio(prevEditing => !prevEditing)
    setEditBioErrors([])
  }

  async function updateContact(data: { text: string }) {
    const updateErrors = await props.updateContactFunc(data)
    if (updateErrors.length === 0) {
      setIsEditingContact(false)
    }
    else {
      setEditContactErrors(updateErrors)
    }
  }

  async function updateBio(data: { text: string }) {
    const updateErrors = await props.updateBioFunc(data)
    if (updateErrors.length === 0) {
      setIsEditingBio(false)
    }
    else {
      setEditBioErrors(updateErrors)
    }
  }

  async function resendVerification(): Promise<void> {

    const res = await fetch(`http://localhost:3000/user/${props.id}/resendVerification`, {
      method: 'GET',
      'credentials': 'include'
    })

    if (!res.ok) {
      const errors = await res.json()
      setSendVerificationErrors(errors)
    }
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

        <Errors
          errors={editContactErrors}
        />

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

        <Errors
          errors={editBioErrors}
        />

        {
          !props.isVerified &&
          <div className="mainprofile--verify">
            <h3 className="mainprofile--verify-txt">Resend Verification Link:</h3>
            <button onClick={resendVerification} className="mainprofile--verify-btn">
              Send
            </button>
          </div>
        }

        <Errors
          errors={sendVerificationErrors}
        />
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