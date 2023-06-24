import { HighlightPost } from "../interfaces/Post"
import "../styles/HomePost.css"

export default function HomePost(props: HighlightPost) {

  function gotoPost() {
    window.open(`http://localhost:5173/post/${props.id}`, '_self')
  }

  return (
    <div className="homepost--container" onClick={gotoPost}>
      <div className="homepost--top-portion">
        <h3>{props.title}</h3>
        <p>{props.username}</p>
      </div>

      <div className="homepost--desc">
        <p className="hompost--desc-text">{props.description}</p>
      </div>
    </div>
  )
}