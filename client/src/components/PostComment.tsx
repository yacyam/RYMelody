import { useState } from "react";
import { Comment } from "../interfaces/Post";
import "../styles/components/PostComment.css"
import { Edit } from "./Edit";
import Errors from "./Error";
import { MsgErr } from "../interfaces/Error";
import Replies from "../pages/post/Replies";

interface CommentSetter extends Comment {
  updateComments: (arg: ((value: Comment[]) => Comment[])) => void,
  postId: string | undefined
}

export default function PostComment(props: CommentSetter) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [updateCommentErrors, setUpdateCommentErrors] = useState<MsgErr>([])
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<MsgErr>([])

  function gotoUserProfile(e: React.SyntheticEvent) {
    window.open(`http://localhost:5173/user/${props.userid}`, '_self')
    e.stopPropagation();
  }

  function setEditing() {
    setIsEditing(oldIsEditing => !oldIsEditing)
    setUpdateCommentErrors([])
  }

  async function updateComment(data: { text: string }) {
    const newCommentData = {
      id: props.id,
      userId: props.userid,
      comment: data.text
    }

    const res = await fetch(`http://localhost:3000/post/${props.postId}/comment`, {
      method: 'PUT',
      'credentials': 'include',
      body: JSON.stringify(newCommentData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errors = await res.json()
      setUpdateCommentErrors(errors)
    }
    else {
      props.updateComments(oldCommentData => {

        const newCommentData = oldCommentData.map((oldComment) => {
          if (oldComment.id !== props.id) {
            return oldComment
          }
          return {
            ...oldComment,
            comment: data.text
          }
        })

        return newCommentData
      })
      setIsEditing(false)
    }
  }

  async function deleteComment(): Promise<void> {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setDeleteCommentErrors([])
      return
    }

    const commentData = {
      id: props.id
    }

    const res = await fetch(`http://localhost:3000/post/${props.postId}/comment`, {
      method: 'DELETE',
      'credentials': 'include',
      body: JSON.stringify(commentData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errors = await res.json()
      setDeleteCommentErrors(errors)
      setConfirmDelete(false)
    } else {
      props.updateComments(oldCommentData => {

        const newCommentData = oldCommentData.filter((oldComment) => {
          return oldComment.id !== props.id
        })

        return newCommentData
      })
    }
  }

  return (
    <div className="comment--container">
      <p
        onClick={gotoUserProfile}
        className="comment--username user-link"
      >
        {props.username}
      </p>
      {
        isEditing ?
          <Edit
            text={props.comment}
            updateFunc={updateComment}
          />
          :
          <div className="comment--main">
            <h4 className="comment--main-text">{props.comment}</h4>
          </div>
      }
      <div className="comment--edit-and-replies">
        {
          props.canModify &&
          <div className="comment--edit">
            <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
            <p onClick={deleteComment}>{confirmDelete ? "Confirm?" : "Delete"}</p>
          </div>
        }
        <Errors
          errors={updateCommentErrors}
        />
        <Errors
          errors={deleteCommentErrors}
        />

        <Replies
          postId={props.postId}
          commentId={props.id}
        />
      </div>

    </div>
  )
}