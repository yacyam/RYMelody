import { useState } from "react";
import { ReplyToData } from "../interfaces/Post";
import CreateReply from "./CreateReply";
import { MsgErr } from "../interfaces/Error";
import Errors from "./Error";
import "../styles/components/Reply.css"

interface PropTypes extends ReplyToData {
  updateReplies: (arg: (value: ReplyToData[]) => ReplyToData[]) => void
}

export default function Reply(props: PropTypes) {
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])
  const [isReplying, setIsReplying] = useState(false)

  async function submitReply(data: { text: string }): Promise<void> {
    const replyData = {
      commentId: props.commentid,
      replyId: props.id,
      reply: data.text,
      isMainCommentReply: false
    }

    const res = await fetch(`http://localhost:3000/post/${props.postid}/reply`, {
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
          rpusername: props.username
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

  const createReplyingToString = () => {
    if (props.replyid !== null && props.rpuserid !== null) {
      return "→ replying to " + props.rpusername
    }
    return ""
  }

  return (
    <div className="reply--container">
      <p onClick={gotoUserProfile} className="reply--username user-link">{props.username}</p>
      <p className="reply--to">{createReplyingToString()}</p>
      <p className="reply--description">{props.reply}</p>
      <div className="reply--create">
        <p onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>
        {isReplying && <CreateReply updateReply={submitReply} />}
        <Errors
          errors={replyErrors}
        />
      </div>
    </div>
  )
}