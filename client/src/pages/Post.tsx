import { useParams } from "react-router-dom"
import "../styles/pages/Post.css"
import { useContext, useEffect, useState } from "react"
import { FullPostData } from "../interfaces/Post"
import AuthContext from "../context/AuthContext"
import PostComment from "../components/PostComment"
import { Edit } from "../components/Edit"

export default function Post() {
  const { id } = useParams()
  const { isLoggedIn } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    postId: id,
    comment: ""
  })
  const [errors, setErrors] = useState<{ message: string }[]>([])
  const [editDescErrors, setEditDescErrors] = useState<{ message: string }[]>([])
  const [fullPostData, setFullPostData] = useState<FullPostData | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:3000/post/${id}`, {
      method: 'GET',
      'credentials': 'include'
    })
      .then(res => res.json())
      .then(data => setFullPostData(data))
  }, [])

  async function likeOrUnlikePost(): Promise<void> {
    if (!fullPostData) return

    const res = await fetch(`http://localhost:3000/post/${id}/like`, {
      method: 'POST',
      'credentials': 'include',
    })

    if (res.ok) {
      setFullPostData(oldPostData => {
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
      if (res.status === 400) {
        const errs = await res.json()
        setEditDescErrors(errs)
      }
      else {
        setEditDescErrors([{ message: 'Something Went Wrong, Please Try Again' }])
      }
    }
    else {
      setFullPostData(oldPostData => {
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
  }

  function gotoUserProfile(e: React.SyntheticEvent, userid: number) {
    window.open(`http://localhost:5173/user/${userid}`, '_self')
    e.stopPropagation();
  }

  function createPostLayout() {
    if (!fullPostData) return undefined

    const postLikedStyle = fullPostData.isPostLiked ? "liked" : ""

    return (
      <div className="post--main-container">
        <div className="post--main-top-portion">
          <h3>{fullPostData.title}</h3>
          <p
            className="user-link"
            onClick={(e: React.SyntheticEvent) => gotoUserProfile(e, fullPostData.userid)}
          >
            {fullPostData.username}
          </p>
        </div>

        {isEditing ? <>
          <Edit text={fullPostData.description} updateFunc={updateDescription} />
          <ul>
            {editDescErrors.map((err, i) => <li key={i}>{err.message}</li>)}
          </ul>
        </> :
          <p className="post--desc-text">{fullPostData.description}</p>
        }

        <audio className="post--audio" controls src={fullPostData.audio} />

        <div className="post--info">
          <button className={`button button-like ${postLikedStyle}`} onClick={likeOrUnlikePost}>
            <i className="fa fa-heart"></i>
            <span>Like</span>
          </button>
          <p className="post--likes">+{fullPostData.amountLikes}</p>
        </div>

        {fullPostData.canModify &&
          <div className="post--edit">
            <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
            <p onClick={deletePost}>{confirmDelete ? "Confirm?" : "Delete"}</p>
          </div>
        }

      </div>
    )
  }

  function createCommentLayout() {
    if (!fullPostData) return undefined

    return fullPostData.comments.map((comment) => {
      return <PostComment
        key={comment.id}
        {...comment}
      />
    })
  }

  const postElement = createPostLayout()
  const commentElement = createCommentLayout()

  function updateForm(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => ({ ...oldFormData, [name]: value }))
    setErrors([])
  }

  async function submitForm(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()

    const res = await fetch('http://localhost:3000/post/comment', {
      method: 'POST',
      'credentials': 'include',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      if (res.status === 500) {
        setErrors([{ message: 'Something Went Wrong, Try Again.' }])
      }
      else {
        const errs = await res.json()
        setErrors(errs)
      }
    }
    else {
      const { id, userId, username } = await res.json()

      setFullPostData(oldPostData => {
        if (!oldPostData) return oldPostData

        const commentsCopy = [...oldPostData.comments]
        commentsCopy.push({
          id: id,
          userid: userId,
          username: username,
          comment: formData.comment
        })
        return {
          ...oldPostData,
          comments: commentsCopy
        }
      })
    }
  }



  const displayErrors = errors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })

  return (
    <div className="post--container">
      {postElement}

      {
        !isLoggedIn ?
          <h5 className="post--notlogged-comment">
            Must be Logged in to Comment on Post
          </h5>
          :
          <form className="post--comment-form" onSubmit={submitForm}>
            <legend>Create a Comment on this Post</legend>
            <textarea
              name="comment"
              className="post--comment-box"
              placeholder="Comment"
              onChange={updateForm}
              value={formData.comment}
            />

            <ul>
              {displayErrors}
            </ul>

            <button>Post Comment</button>
          </form>
      }
      <div className="post--all-comments">
        <h2 className="post--all-comments-title">Comments</h2>
        {commentElement}
      </div>
    </div>
  )
}