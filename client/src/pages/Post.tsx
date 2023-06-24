import { useParams } from "react-router-dom"
import "../styles/Post.css"
import { useContext, useEffect, useState } from "react"
import { FullPost } from "../interfaces/Post"
import AuthContext from "../context/AuthContext"
import PostComment from "../components/PostComment"

export default function Post() {
  const { id } = useParams()
  const { isLoggedIn, userData } = useContext(AuthContext)
  const [postData, setPostData] = useState<FullPost | undefined>(undefined)
  const [formData, setFormData] = useState({
    postId: id,
    comment: ""
  })
  const [errors, setErrors] = useState<{ message: string }[]>([])

  console.log(userData)

  useEffect(() => {
    fetch(`http://localhost:3000/post/${id}`)
      .then(res => res.json())
      .then(data => setPostData(data))
  }, [])

  function createPostLayout() {
    if (!postData) return undefined

    return (
      <div className="post--main-container">
        <div className="post--main-top-portion">
          <h3>{postData.title}</h3>
          <p>{postData.username}</p>
        </div>

        <p className="post--desc-text">{postData.description}</p>
        <audio className="post--audio" controls src={postData.audio} />
      </div>
    )
  }

  function createCommentLayout() {
    if (!postData) return undefined

    return postData.comments.map((comment) => {
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
      location.reload()
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