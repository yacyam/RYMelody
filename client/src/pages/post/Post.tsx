import { useParams } from "react-router-dom"
import "../../styles/pages/Post.css"
import { useEffect, useState } from "react"
import { FullPostData, Tags } from "../../interfaces/Post"
import { Edit } from "../../components/Edit"
import { MsgErr } from "../../interfaces/Error"
import Errors from "../../components/Error"
import Comments from "./Comments"

export default function Post() {
  const { id } = useParams()
  const [editDescErrors, setEditDescErrors] = useState<MsgErr>([])
  const [deletePostErrors, setDeletePostErrors] = useState<MsgErr>([])
  const [doesNotExist, setDoesNotExist] = useState<boolean>(false)
  const [postData, setPostData] = useState<FullPostData | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:3000/post/${id}`, {
      method: 'GET',
      'credentials': 'include'
    })
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('Post Does Not Exist')
      })
      .then(data => setPostData(data))
      .catch(() => setDoesNotExist(true))
  }, [id])

  async function likeOrUnlikePost(): Promise<void> {
    if (!postData) return

    const res = await fetch(`http://localhost:3000/post/${id}/like`, {
      method: 'POST',
      'credentials': 'include',
    })

    if (res.ok) {
      setPostData(oldPostData => {
        if (!oldPostData) return oldPostData

        const isLiked = !oldPostData.isPostLiked
        const currLikes = oldPostData.amountLikes
        const changedLikes = isLiked ? currLikes + 1 : currLikes - 1
        return {
          ...oldPostData,
          isPostLiked: isLiked,
          amountLikes: changedLikes
        }
      })
    }
  }

  async function updateDescription(data: { text: string }): Promise<void> {
    const res = await fetch(`http://localhost:3000/post/${id}/update`, {
      method: 'PUT',
      'credentials': 'include',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    })

    if (!res.ok) {
      const errs = await res.json()
      setEditDescErrors(errs)
    }
    else {
      setPostData(oldPostData => {
        if (!oldPostData) return oldPostData

        return {
          ...oldPostData,
          description: data.text
        }
      })
      setIsEditing(false)
    }
  }

  function setEditing(): void {
    setIsEditing(prevEdit => !prevEdit)
    setEditDescErrors([])
  }

  async function deletePost(): Promise<void> {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    const res = await fetch(`http://localhost:3000/post/${id}`, {
      method: 'DELETE',
      'credentials': 'include'
    })

    if (res.ok) {
      window.open('http://localhost:5173/', '_self')
    }
    else {
      const errors = await res.json()
      setDeletePostErrors(errors)
      setConfirmDelete(false)
    }
  }

  function createTagString(tags: Tags) {
    const allGenresList: string[] = []
    for (const tag in tags) {
      if (tags[tag]) {
        allGenresList.push(tag.charAt(0).toUpperCase() + tag.substring(1))
      }
    }
    if (allGenresList.length === 0) {
      return ""
    }
    const allGenres = "Genres: " + allGenresList.reduce((prev, curr) => prev + ", " + curr)
    return allGenres
  }

  function gotoUserProfile(e: React.SyntheticEvent, userid: number) {
    window.open(`http://localhost:5173/user/${userid}`, '_self')
    e.stopPropagation();
  }

  function createPostLayout() {
    if (!postData) return undefined

    const postLikedStyle = postData.isPostLiked ? "liked" : "like"
    const fullGenres = createTagString(postData.tags)

    return (
      <div className="post--main-container">
        <div className="post--main-top-portion">
          <div className="post--title-and-tags">
            <h3>{postData.title}</h3>
            {fullGenres && <p>○</p>}
            <p>{fullGenres}</p>
          </div>
          <p
            className="user-link"
            onClick={(e: React.SyntheticEvent) => gotoUserProfile(e, postData.userid)}
          >
            {postData.username}
          </p>

        </div>

        {isEditing ?
          <>
            <Edit text={postData.description} updateFunc={updateDescription} />

            <Errors
              errors={editDescErrors}
            />
          </> :
          <p className="post--desc-text">{postData.description}</p>
        }

        <audio className="post--audio" controls src={postData.audio} />

        <div className="post--info">
          <button className={`like--select ${postLikedStyle}`} onClick={likeOrUnlikePost}>
            Like
          </button>
          <p className="post--likes">+{postData.amountLikes}</p>
        </div>

        {postData.canModify &&
          <div className="post--edit">
            <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
            <p onClick={deletePost}>{confirmDelete ? "Confirm?" : "Delete"}</p>
          </div>
        }
        <Errors
          errors={deletePostErrors}
        />

      </div>
    )
  }

  const postElement = createPostLayout()

  return (
    <>
      {doesNotExist ? <h1 className="post--not-exist">This Post Does Not Exist</h1>
        :
        <div className="post--container">
          {postElement}

          {postData && <Comments postId={`${postData.id}`} />}
        </div>
      }

    </>
  )
}