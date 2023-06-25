import { useParams } from "react-router-dom"
import "../styles/Post.css"
import { useContext, useEffect, useState } from "react"
import { FullPostData } from "../interfaces/Post"
import AuthContext from "../context/AuthContext"
import PostComment from "../components/PostComment"

export default function Post() {
  const { id } = useParams()
  const { isLoggedIn } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    postId: id,
    comment: ""
  })
  const [errors, setErrors] = useState<{ message: string }[]>([])
  const [fullPostData, setFullPostData] = useState<FullPostData | undefined>(undefined)

  useEffect(() => {
    fetch(`http://localhost:3000/post/${id}`, {
      method: 'GET',
      'credentials': 'include'
    })
      .then(res => res.json())
      .then(data => setFullPostData(data))
  }, [])

  async function likeOrUnlikePost() {
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

  function createPostLayout() {
    if (!fullPostData) return undefined

    const postLikedStyle = fullPostData.isPostLiked ? "liked" : ""

    return (
      <div className="post--main-container">
        <div className="post--main-top-portion">
          <h3>{fullPostData.title}</h3>
          <p>{fullPostData.username}</p>
        </div>

        <p className="post--desc-text">{fullPostData.description}</p>
        <audio className="post--audio" controls src={fullPostData.audio} />

        <div className="post--info">
          <button className={`button button-like ${postLikedStyle}`} onClick={likeOrUnlikePost}>
            <i className="fa fa-heart"></i>
            <span>Like</span>
          </button>
          <p className="post--likes">+{fullPostData.amountLikes}</p>
        </div>

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
      const { id, username } = await res.json()

      setFullPostData(oldPostData => {
        if (!oldPostData) return oldPostData

        const commentsCopy = [...oldPostData.comments]
        commentsCopy.push({
          id: id,
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