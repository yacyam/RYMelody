import { useEffect } from "react"
import { ReplyToData } from "../../interfaces/Post"
import Reply from "../../components/Reply"
import "../../styles/pages/Replies.css"

interface PropTypes {
  postId: string | undefined,
  commentId: number,
  replies: ReplyToData[],
  setReplies: (arg: (value: ReplyToData[]) => ReplyToData[]) => void
}

export default function Replies(props: PropTypes) {

  useEffect(() => {
    fetch(`http://localhost:3000/post/${props.postId}/comment/${props.commentId}/replies`, {
      method: 'GET',
      'credentials': 'include',
    })
      .then(res => res.json())
      .then(data => {
        props.setReplies(data.replies)
      })
  }, [])

  const replyElements = props.replies.map((reply) => {
    return <Reply
      key={reply.id}
      {...reply}
      updateReplies={props.setReplies}
    />
  })

  return (
    <>
      <div className="replies--all">
        {replyElements}
      </div>
    </>
  )
}