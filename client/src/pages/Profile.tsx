import { useParams } from "react-router-dom";
import "../styles/pages/Profile.css"
import { useEffect, useState } from "react";
import { UserProfile } from "../interfaces/Profile";
import MainProfile from "../components/MainProfile";
import HomePost from "../components/HomePost";
import { MsgErr } from "../interfaces/Error"

export default function Profile() {
  const { id } = useParams()
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>()
  const [amountShowPosts, setAmountShowPosts] = useState(3)
  const [amountShowLikes, setAmountShowLikes] = useState(3)
  const [doesNotExist, setDoesNotExist] = useState<boolean>(false)

  useEffect(() => {
    fetch(`http://localhost:3000/user/${id}`, {
      'credentials': 'include'
    })
      .then(res => {
        if (res.ok) return res.json()

        throw new Error('User Does Not Exist')
      })
      .then(data => setUserProfile(data))
      .catch(() => setDoesNotExist(true))
  }, [])

  async function updateContact(data: { text: string }): Promise<MsgErr> {
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
      return []
    }
    else {
      const errors = await res.json()
      return errors
    }
  }

  async function updateBio(data: { text: string }): Promise<MsgErr> {
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
      return []
    }
    else {
      const errors = await res.json()
      return errors
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
  const allLikesLength = userProfile?.likes.length || 0

  return (
    <>
      {doesNotExist ? <h1 className="profile--user-not-exist">This User Does Not Exist</h1>
        :
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
      }
    </>
  )
}