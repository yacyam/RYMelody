import { Comment } from "../interfaces/Post";
import "../styles/components/PostComment.css"

export default function PostComment(props: Comment) {

  function gotoUserProfile(e: React.SyntheticEvent) {
    window.open(`http://localhost:5173/user/${props.userid}`, '_self')
    e.stopPropagation();
  }

  return (
    <div className="comment--container">
      <p
        onClick={gotoUserProfile}
        className="comment--username user-link"
      >
        {props.username}
      </p>
      <div className="comment--main">
        <h4 className="comment--main-text">{props.comment}</h4>
      </div>
    </div>
  )
}