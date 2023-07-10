import { useState } from "react";
import { Comment, FullPostData } from "../interfaces/Post";
import "../styles/components/PostComment.css"
import { Edit } from "./Edit";
import Errors from "./Error";
import { MsgErr } from "../interfaces/Error";
import CreateReply from "./CreateReply";
import Reply from "../pages/Reply";

interface CommentSetter extends Comment {
  updatePost: (arg: ((value: FullPostData | undefined) => FullPostData | undefined)) => void,
  postId: string | undefined
}
//need to give comments their own state
export default function PostComment(props: CommentSetter) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [updateCommentErrors, setUpdateCommentErrors] = useState<MsgErr>([])
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<MsgErr>([])
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])
  const [isReplying, setIsReplying] = useState(false)

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

  async function submitReply(data: { text: string }): Promise<void> {
    const replyData = {
      commentId: props.id,
      replyId: props.id,
      reply: data.text,
      isMainCommentReply: true
    }

    const res = await fetch(`http://localhost:3000/post/${props.postId}/reply`, {
      method: 'POST',
      'credentials': 'include',
      body: JSON.stringify(replyData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const errors = await res.json()
      setReplyErrors(errors)
    }
    else {
      const { newReplyId, userId, username }: { newReplyId: number, userId: number, username: string }
        = await res.json()

      props.updatePost(oldPostData => {
        if (!oldPostData) return oldPostData

        const updatedComments = oldPostData.comments.map((comment) => {
          if (comment.id !== props.id || props.postId === undefined) {
            return comment
          }
          const newReplies = [...comment.replies]

          newReplies.push({
            id: newReplyId,
            userid: userId,
            username,
            commentid: props.id,
            replyid: props.id,
            postid: parseInt(props.postId),
            reply: data.text,
            replies: []
          })

          return {
            ...comment,
            replies: newReplies
          }
        })

        return {
          ...oldPostData,
          comments: updatedComments
        }
      })
    }
  }

  function setReplying() {
    setIsReplying(prevReplying => !prevReplying)
  }

  const displayReplies = props.replies.map((reply) => {
    return (
      <Reply
        key={reply.id}
        {...reply}
        leftMargin={5}
      />
    )
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
      <div className="comment--edit">
        {
          props.canModify &&
          <>
            <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
            <p onClick={deleteComment}>{confirmDelete ? "Confirm?" : "Delete"}</p>
          </>
        }
        <p onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>
      </div>

      {isReplying && <CreateReply updateReply={submitReply} />}

      <Errors
        errors={updateCommentErrors}
      />
      <Errors
        errors={deleteCommentErrors}
      />
      <Errors
        errors={replyErrors}
      />
      <div className="postcomment--replies">
        {displayReplies}
      </div>
    </div>
  )
}