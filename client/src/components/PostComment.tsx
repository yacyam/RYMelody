import { useState } from "react";
import { Comment, FullPostData } from "../interfaces/Post";
import "../styles/components/PostComment.css"
import { Edit } from "./Edit";

interface CommentSetter extends Comment {
  updatePost: (arg: ((value: FullPostData | undefined) => FullPostData | undefined)) => void,
  postId: string | undefined
}

export default function PostComment(props: CommentSetter) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [updateCommentErrors, setUpdateCommentErrors] = useState<{ message: string }[]>([])
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<{ message: string }[]>([])

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
      if (res.status === 500) {
        setUpdateCommentErrors([{ message: 'Something Went Wrong, Please Try Again ' }])
      }
      else {
        const errors = await res.json()
        setUpdateCommentErrors(errors)
      }
    }
    else {
      props.updatePost(oldPostData => {
        if (!oldPostData) return oldPostData

        const newCommentData = oldPostData.comments.map((oldComment) => {
          if (oldComment.id !== props.id) {
            return oldComment
          }
          return {
            ...oldComment,
            comment: data.text
          }
        })

        return {
          ...oldPostData,
          comments: newCommentData
        }
      })
      setIsEditing(false)
    }
  }

  async function deleteComment() {
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
      if (res.status === 500) {
        setDeleteCommentErrors([{ message: 'Something Went Wrong, Please Try Again ' }])
      }
      else {
        const errors = await res.json()
        setDeleteCommentErrors(errors)
      }
    } else {
      props.updatePost(oldPostData => {
        if (!oldPostData) return oldPostData

        const newCommentData = oldPostData.comments.filter((oldComment) => {
          return oldComment.id !== props.id
        })

        return {
          ...oldPostData,
          comments: newCommentData
        }
      })
    }
  }

  const displayUpdateErrors = updateCommentErrors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })

  const displayDeleteErrors = deleteCommentErrors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })

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
      <ul>
        {displayUpdateErrors}
      </ul>
      {
        props.canModify &&
        <div className="comment--edit">
          <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
          <p onClick={deleteComment}>{confirmDelete ? "Confirm?" : "Delete"}</p>
        </div>
      }
      <ul>
        {displayDeleteErrors}
      </ul>
    </div>
  )
}