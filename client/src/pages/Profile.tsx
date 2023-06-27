import { useParams } from "react-router-dom";
import "../styles/pages/Profile.css"
import { useEffect, useState } from "react";
import { UserProfile } from "../interfaces/Profile";
import MainProfile from "../components/MainProfile";

export default function Profile() {
  const { id } = useParams()
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>()
  console.log(userProfile)

  useEffect(() => {
    fetch(`http://localhost:3000/user/${id}`, {
      'credentials': 'include'
    })
      .then(res => res.json())
      .then(data => setUserProfile(data))
  }, [])

  async function updateContact(data: { text: string }): Promise<void> {
    const res = await fetch(`http://localhost:3000/user/${id}/updateContact`, {
      method: 'PUT',
      'credentials': 'include',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    })

    if (res.ok) {
      setUserProfile(oldUserProfile => {
        if (!oldUserProfile) return

        return {
          ...oldUserProfile,
          contact: data.text
        }
      })
    }
  }

  async function updateBio(data: { text: string }): Promise<void> {
    const res = await fetch(`http://localhost:3000/user/${id}/updateBio`, {
      method: 'PUT',
      'credentials': 'include',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    })

    if (res.ok) {
      setUserProfile(oldUserProfile => {
        if (!oldUserProfile) return

        return {
          ...oldUserProfile,
          bio: data.text
        }
      })
    }
  }

  function ProfileComponent() {
    if (!userProfile) return

    return (
      <MainProfile
        {...userProfile}
        updateContactFunc={updateContact}
        updateBioFunc={updateBio}
      />
    )
  }

  return (
    <div className="profile--container">
      {ProfileComponent()}
    </div>
  )
}