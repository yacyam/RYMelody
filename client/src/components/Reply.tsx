import { useState } from "react";
import { ReplyToData } from "../interfaces/Post";
import CreateReply from "./CreateReply";
import { MsgErr } from "../interfaces/Error";
import Errors from "./Error";
import "../styles/components/Reply.css"
import { Edit } from "./Edit";

interface PropTypes extends ReplyToData {
  updateReplies: (arg: (value: ReplyToData[]) => ReplyToData[]) => void
}

export default function Reply(props: PropTypes) {
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editErrors, setEditErrors] = useState<MsgErr>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteErrors, setDeleteErrors] = useState<MsgErr>([])
  const [showOriginalReply, setShowOriginalReply] = useState(false)

  async function submitReply(data: { text: string }): Promise<void> {
    const replyData = {
      commentId: props.commentid,
      replyId: props.id,
      reply: data.text,
      isMainCommentReply: false
    }

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postid}/reply`, {
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

      props.updateReplies(oldReplyData => {

        const newReplies = [...oldReplyData]

        newReplies.push({
          id: newReplyId,
          userid: userId,
          username,
          commentid: props.commentid,
          replyid: props.id,
          postid: props.postid,
          reply: data.text,
          rpreply: props.reply,
          rpuserid: props.userid,
          rpusername: props.username,
          canModify: true
        })

        return newReplies
      })
    }
  }

  function setReplying() {
    setIsReplying(prevReplying => !prevReplying)
    setReplyErrors([])
  }

  function gotoUserProfile(e: React.SyntheticEvent) {
    e.preventDefault()
    window.open(`http://localhost:5173/user/${props.userid}`, '_self')
  }

  function showOriginal() {
    setShowOriginalReply(prevShow => !prevShow)
  }

  const createReplyingToString = () => {
    if (props.replyid !== null && props.rpuserid !== null) {
      return <div onClick={showOriginal} className="reply--to-info">
        <p className="reply--to-username">{showOriginalReply ? "↓" : "→"} {props.rpusername}</p>
        <div className="reply--display-origin">
          <p>...</p>
        </div>
      </div>
    }
  }

  function setEditing() {
    setIsEditing(prevEdit => !prevEdit)
    setEditErrors([])
  }

  async function submitEdit(data: { text: string }): Promise<void> {
    const editData = {
      text: data.text,
      replyId: props.id,
      commentId: props.commentid
    }

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postid}/reply`, {
      method: 'PUT',
      'credentials': 'include',
      body: JSON.stringify(editData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const errors = await res.json()
      setEditErrors(errors)
    }
    else {
      props.updateReplies(oldReplies => {

        const newReplies = oldReplies.map((oldReply) => {
          if (oldReply.id === props.id) {
            return { ...oldReply, reply: data.text }
          }
          else if (oldReply.replyid === props.id) {
            return { ...oldReply, rpreply: data.text }
          }
          return oldReply
        })

        return newReplies
      })

      setIsEditing(false)
      setEditErrors([])
    }
  }

  async function deleteReply(): Promise<void> {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setDeleteErrors([])
      return
    }
    const deleteData = {
      replyId: props.id,
      commentId: props.commentid
    }

    const res = await fetch(`https://rymelody-backend.onrender.com/post/${props.postid}/reply`, {
      method: 'DELETE',
      'credentials': 'include',
      body: JSON.stringify(deleteData),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const errors = await res.json()
      setDeleteErrors(errors)
    }
    else {
      props.updateReplies(oldReplies => {

        const filteredReplies = oldReplies.filter((oldReply) => {
          return oldReply.id !== props.id
        })

        const replyingToUpdated = filteredReplies.map((oldReply) => {
          if (oldReply.replyid === props.id) {
            return {
              ...oldReply,
              rpreply: null,
              rpuserid: null,
              rpusername: null
            }
          }
          return oldReply
        })

        return replyingToUpdated
      })
    }
  }

  return (
    <div className="reply--container">
      <p onClick={gotoUserProfile} className="reply--username user-link">{props.username}</p>
      {createReplyingToString()}
      {showOriginalReply &&
        <div className="reply--rpreply">
          <p>{props.rpreply}</p>
        </div>
      }
      {isEditing ?
        <Edit text={props.reply} updateFunc={submitEdit} />
        :
        <p className="reply--description">{props.reply}</p>
      }
      <div className="reply--create-edit">
        {
          props.canModify &&
          <>
            <p onClick={setEditing}>{isEditing ? "Cancel" : "Edit"}</p>
            <p onClick={deleteReply}>{confirmDelete ? "Confirm?" : "Delete"}</p>
          </>
        }
        <p onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>
      </div>

      <Errors
        errors={editErrors}
      />

      <Errors
        errors={deleteErrors}
      />

      {isReplying && <CreateReply updateReply={submitReply} />}
      <Errors
        errors={replyErrors}
      />
    </div>
  )
}