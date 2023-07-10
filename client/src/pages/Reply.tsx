import { useState } from "react";
import { ReplyData } from "../interfaces/Post";
import CreateReply from "../components/CreateReply";
import { MsgErr } from "../interfaces/Error";
import Errors from "../components/Error";

interface PropTypes extends ReplyData {
  leftMargin: number
}

// instead of making one huge state, can get everything
// then create separate states for whats needed
export default function Reply(props: PropTypes) {
  const [replyDescription, setReplyDescription] = useState(props.reply)
  const [repliesData, setRepliesData] = useState(props.replies)
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])
  const [isReplying, setIsReplying] = useState(false)


  const replyElements = repliesData.map((reply) => {
    return (
      <Reply
        key={reply.id}
        {...reply}
        leftMargin={props.leftMargin + 5}
      />
    )
  })

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

      setRepliesData(oldReplyData => {

        const newReplies = [...oldReplyData]

        newReplies.push({
          id: newReplyId,
          userid: userId,
          username,
          commentid: props.commentid,
          replyid: props.id,
          postid: props.postid,
          reply: data.text,
          replies: []
        })

        return newReplies
      })
    }
  }

  function setReplying() {
    setIsReplying(prevReplying => !prevReplying)
  }

  return (
    <div style={{ marginLeft: `${props.leftMargin}px` }}>
      <p>{props.username}</p>
      <p>{replyDescription}</p>
      <div>
        {isReplying && <CreateReply updateReply={submitReply} />}
        <p onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>
        <Errors
          errors={replyErrors}
        />
      </div>
      {replyElements}
    </div>
  )
}