import { useState } from "react";
import { Comment, ReplyToData } from "../interfaces/Post";
import "../styles/components/PostComment.css"
import { Edit } from "./Edit";
import Errors from "./Error";
import { MsgErr } from "../interfaces/Error";
import Replies from "../pages/post/Replies";
import CreateReply from "./CreateReply";

interface CommentSetter extends Comment {
  updateComments: (arg: ((value: Comment[]) => Comment[])) => void,
  postId: string | undefined
}

export default function PostComment(props: CommentSetter) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [updateCommentErrors, setUpdateCommentErrors] = useState<MsgErr>([])
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<MsgErr>([])
  const [repliesData, setRepliesData] = useState<ReplyToData[]>([])
  const [isShowingReplies, setIsShowingReplies] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])

  function gotoUserProfile(e: React.SyntheticEvent) {
    window.open(`http://localhost:5173/user/${props.userid}`, '_self')
    e.stopPropagation();
  }

  function setEditing() {
    setIsEditing(oldIsEditing => !oldIsEditing)
    setUpdateCommentErrors([])
  }

  function setShowReply() {
    setIsShowingReplies(prevShowing => !prevShowing)
  }

  function setReplying() {
    setIsReplying(prevReplying => !prevReplying)
    setReplyErrors([])
  }

  async function updateComment(data: { text: string }) {
    const newCommentData = {
      id: props.id,
      userId: props.userid,
      comment: data.text
    }

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postId}/comment`, {
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

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postId}/comment`, {
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

  async function submitReply(data: { text: string }): Promise<void> {
    const postId: string = props.postId || "-1"

    const replyData = {
      commentId: props.id,
      reply: data.text,
      isMainCommentReply: true
    }

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${postId}/reply`, {
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

      setRepliesData(oldRepliesData => {
        const newReplies = [...oldRepliesData]

        newReplies.push({
          id: newReplyId,
          userid: userId,
          username,
          commentid: props.id,
          replyid: null,
          postid: parseInt(postId),
          reply: data.text,
          rpreply: null,
          rpuserid: null,
          rpusername: null,
          canModify: true
        })

        return newReplies
      })

      setIsShowingReplies(true)
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
        <div className="comment--edit">
          {
            props.canModify &&
            <>
              <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
              <p onClick={deleteComment}>{confirmDelete ? "Confirm?" : "Delete"}</p>
            </>
          }
          <p onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>
          <p onClick={setShowReply}>{isShowingReplies ? "Hide" : "Show"} Replies</p>

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

        {isShowingReplies &&
          <Replies
            postId={props.postId}
            commentId={props.id}
            replies={repliesData}
            setReplies={setRepliesData}
          />
        }
      </div>

    </div>
  )
}