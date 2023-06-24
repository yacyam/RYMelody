import { Comment } from "../interfaces/Post";
import "../styles/PostComment.css"

export default function PostComment(props: Comment) {

  return (
    <div className="comment--container">
      <p className="comment--username">{props.username}</p>
      <div className="comment--main">
        <h4 className="comment--main-text">{props.comment}</h4>
      </div>
    </div>
  )
}