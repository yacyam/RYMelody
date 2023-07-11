import { useEffect, useState } from "react"
import { ReplyData } from "../../interfaces/Post"
import { MsgErr } from "../../interfaces/Error"
import Errors from "../../components/Error"
import CreateReply from "../../components/CreateReply"
import Reply from "../../components/Reply"
import "../../styles/pages/Replies.css"

interface PropTypes {
  postId: string | undefined,
  commentId: number
}

export default function Replies(props: PropTypes) {

  const [repliesData, setRepliesData] = useState<ReplyData[]>([])
  const [replyErrors, setReplyErrors] = useState<MsgErr>([])
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:3000/post/${props.postId}/comment/${props.commentId}/replies`, {
      method: 'GET',
      'credentials': 'include',
    })
      .then(res => res.json())
      .then(data => setRepliesData(data.replies))

  }, [])

  async function submitReply(data: { text: string }): Promise<void> {
    const postId: string = props.postId || "-1"

    const replyData = {
      commentId: props.commentId,
      replyId: props.commentId,
      reply: data.text,
      isMainCommentReply: true
    }

    const res = await fetch(`http://localhost:3000/post/${postId}/reply`, {
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
          commentid: props.commentId,
          replyid: props.commentId,
          postid: parseInt(postId),
          reply: data.text,
        })

        return newReplies
      })
    }
  }

  function setReplying() {
    setIsReplying(prevReplying => !prevReplying)
  }

  const replyElements = repliesData.map((reply) => {
    return <Reply
      key={reply.id}
      {...reply}
      updateReplies={setRepliesData}
    />
  })

  return (
    <>
      <p className="replies--create" onClick={setReplying}>{isReplying ? "Cancel" : "Reply"}</p>

      {isReplying && <CreateReply updateReply={submitReply} />}

      <Errors
        errors={replyErrors}
      />
      <div className="replies--all">
        {replyElements}
      </div>
    </>
  )
}