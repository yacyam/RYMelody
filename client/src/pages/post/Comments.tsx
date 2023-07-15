import { useEffect, useState, useContext } from "react";
import { Comment } from "../../interfaces/Post";
import { MsgErr } from "../../interfaces/Error";
import Errors from "../../components/Error";
import PostComment from "../../components/PostComment";
import AuthContext from "../../context/AuthContext";
import "../../styles/pages/Comments.css"

export default function Comments(props: { postId: string }) {

  const [allComments, setAllComments] = useState<Comment[]>([])
  const [formData, setFormData] = useState({ comment: "" })
  const [commentErrors, setCommentErrors] = useState<MsgErr>([])
  const { isLoggedIn } = useContext(AuthContext)

  useEffect(() => {
    fetch(`https://rymelody-backend.onrender.com/post/${props.postId}/comments`, {
      method: 'GET',
      'credentials': 'include'
    })
      .then(res => res.json())
      .then(data => setAllComments(data.comments))
  }, [props.postId])

  function updateComment(e: React.SyntheticEvent): void {
    const { name, value } = e.target as HTMLInputElement

    setFormData(oldFormData => ({ ...oldFormData, [name]: value }))
    setCommentErrors([])
  }


  async function submitComment(e: React.SyntheticEvent): Promise<void> {
    e.preventDefault()

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postId}/comment`, {
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

      setAllComments(oldCommentsData => {

        const commentsCopy = [...oldCommentsData]
        commentsCopy.push({
          id: id,
          userid: userId,
          username: username,
          comment: formData.comment,
          replies: [],
          canModify: true
        })
        return commentsCopy
      })
    }
  }

  const commentElements = allComments.map((comment) => {
    return <PostComment
      key={comment.id}
      {...comment}
      updateComments={setAllComments}
      postId={props.postId}
    />
  })


  return (
    <div className="comments--container">
      {
        !isLoggedIn ?
          <h5 className="comments--post-notlogged">
            Must be Logged in to Comment on Post
          </h5>
          :
          <form className="comments--post-form" onSubmit={submitComment}>
            <legend>Leave a Comment on this Post</legend>
            <textarea
              name="comment"
              className="comments--post-box"
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

      <div className="comments--all-comments">
        <h2 className="comments--all-comments-title">Comments</h2>
        {commentElements}
      </div>

    </div >
  )
}