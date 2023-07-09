import { useParams } from "react-router-dom"
import "../styles/pages/Post.css"
import { useContext, useEffect, useState } from "react"
import { FullPostData, Tags } from "../interfaces/Post"
import AuthContext from "../context/AuthContext"
import PostComment from "../components/PostComment"
import { Edit } from "../components/Edit"
import { MsgErr } from "../interfaces/Error"
import Errors from "../components/Error"

export default function Post() {
  const { id } = useParams()
  const { isLoggedIn } = useContext(AuthContext)
  const [formData, setFormData] = useState({ comment: "" })
  const [commentErrors, setCommentErrors] = useState<MsgErr>([])
  const [editDescErrors, setEditDescErrors] = useState<MsgErr>([])
  const [deletePostErrors, setDeletePostErrors] = useState<MsgErr>([])
  const [doesNotExist, setDoesNotExist] = useState<boolean>(false)
  const [fullPostData, setFullPostData] = useState<FullPostData | undefined>(undefined)
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
      .then(data => setFullPostData(data))
      .catch(() => setDoesNotExist(true))
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
      const errs = await res.json()
      setEditDescErrors(errs)
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
    if (!fullPostData) return undefined

    const postLikedStyle = fullPostData.isPostLiked ? "liked" : "like"
    const fullGenres = createTagString(fullPostData.tags)

    return (
      <div className="post--main-container">
        <div className="post--main-top-portion">
          <div className="post--title-and-tags">
            <h3>{fullPostData.title}</h3>
            {fullGenres && <p>○</p>}
            <p>{fullGenres}</p>
          </div>
          <p
            className="user-link"
            onClick={(e: React.SyntheticEvent) => gotoUserProfile(e, fullPostData.userid)}
          >
            {fullPostData.username}
          </p>

        </div>

        {isEditing ?
          <>
            <Edit text={fullPostData.description} updateFunc={updateDescription} />

            <Errors
              errors={editDescErrors}
            />
          </> :
          <p className="post--desc-text">{fullPostData.description}</p>
        }

        <audio className="post--audio" controls src={fullPostData.audio} />

        <div className="post--info">
          <button className={`like--select ${postLikedStyle}`} onClick={likeOrUnlikePost}>
            Like
          </button>
          <p className="post--likes">+{fullPostData.amountLikes}</p>
        </div>

        {fullPostData.canModify &&
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

  function createCommentLayout() {
    if (!fullPostData) return undefined

    return fullPostData.comments.map((comment) => {
      return <PostComment
        key={comment.id}
        {...comment}
        updatePost={setFullPostData}
        postId={id}
      />
    })
  }

  const postElement = createPostLayout()
  const commentElement = createCommentLayout()

  function updateComment(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => ({ ...oldFormData, [name]: value }))
    setCommentErrors([])
  }

  async function submitComment(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()

    const res = await fetch(`http://localhost:3000/post/${id}/comment`, {
      method: 'POST',
      'credentials': 'include',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const errs = await res.json()
      setCommentErrors(errs)
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
          comment: formData.comment,
          canModify: true
        })
        return {
          ...oldPostData,
          comments: commentsCopy
        }
      })
    }
  }

  return (
    <>
      {doesNotExist ? <h1 className="post--not-exist">This Post Does Not Exist</h1>
        :
        <div className="post--container">
          {postElement}

          {
            !isLoggedIn ?
              <h5 className="post--notlogged-comment">
                Must be Logged in to Comment on Post
              </h5>
              :
              <form className="post--comment-form" onSubmit={submitComment}>
                <legend>Leave a Comment on this Post</legend>
                <textarea
                  name="comment"
                  className="post--comment-box"
                  placeholder="Comment"
                  onChange={updateComment}
                  value={formData.comment}
                />

                <Errors
                  errors={commentErrors}
                />

                <button>Post Comment</button>
              </form>
          }
          <div className="post--all-comments">
            <h2 className="post--all-comments-title">Comments</h2>
            {commentElement}
          </div>
        </div>
      }

    </>
  )
}