import { useParams } from "react-router-dom";
import "../styles/pages/Profile.css"
import { useEffect, useState } from "react";
import { UserProfile } from "../interfaces/Profile";
import MainProfile from "../components/MainProfile";
import HomePost from "../components/HomePost";

export default function Profile() {
  const { id } = useParams()
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>()
  const [amountShowPosts, setAmountShowPosts] = useState(3)
  const [amountShowLikes, setAmountShowLikes] = useState(3)

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

  function updateAmountShow(updateShow: (arg0: (value: number) => number) => void) {
    updateShow(oldAmount => oldAmount + 3)
  }

  const postsElements = userProfile?.posts.map(post => {
    return <div key={post.id}>
      {HomePost(post)}
    </div>
  }).filter((_, i) => i < amountShowPosts)

  const likeElements = userProfile?.likes.map(like => {
    return <div key={like.id}>
      {HomePost(like)}
    </div>
  }).filter((_, i) => i < amountShowLikes)

  const allPostsLength = userProfile?.posts.length || 0
  const allLikesLength = userProfile?.posts.length || 0

  return (
    <div className="profile--container">
      {ProfileComponent()}
      <div className="profile--posts">
        <h1 className="profile--posts-title">Posts</h1>
        {postsElements}
        {amountShowPosts < allPostsLength &&
          <div className="profile--button-container">
            <button onClick={() => updateAmountShow(setAmountShowPosts)}>
              See More
            </button>
          </div>
        }
      </div>
      <div className="profile--likes">
        <h1 className="profile--likes-title">Likes</h1>
        {likeElements}
        {amountShowLikes < allLikesLength &&
          <div className="profile--button-container">
            <button onClick={() => updateAmountShow(setAmountShowLikes)}>
              See More
            </button>
          </div>
        }
      </div>
    </div>
  )
}