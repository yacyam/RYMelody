import { HighlightPost } from "../interfaces/Post"
import "../styles/components/HomePost.css"

export default function HomePost(props: HighlightPost) {

  function gotoPost() {
    window.open(`http://localhost:5173/post/${props.id}`, '_self')
  }

  function gotoUserProfile(e: React.SyntheticEvent) {
    window.open(`http://localhost:5173/user/${props.userid}`, '_self')
    e.stopPropagation();
  }

  return (
    <div className="homepost--container" onClick={gotoPost}>
      <div className="homepost--top-portion">
        <h3>{props.title}</h3>
        <p onClick={gotoUserProfile} className="user-link">
          {props.username}
        </p>
      </div>

      <div className="homepost--desc">
        <p className="hompost--desc-text">{props.description}</p>
      </div>
    </div>
  )
}