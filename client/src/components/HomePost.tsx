import { HighlightPost } from "../interfaces/Post"
import "../styles/components/HomePost.css"

export default function HomePost(props: HighlightPost) {

  function gotoPost() {
    window.open(`https://rymelody.netlify.app/post/${props.id}`, '_self')
  }

  function gotoPostNewWindow(e: React.SyntheticEvent) {
    window.open(`https://rymelody.netlify.app/post/${props.id}`)
    e.preventDefault()
  }

  function gotoUserProfile(e: React.SyntheticEvent) {
    window.open(`https://rymelody.netlify.app/user/${props.userid}`, '_self')
    e.stopPropagation()
  }

  function gotoUserProfileNewWindow(e: React.SyntheticEvent) {
    window.open(`https://rymelody.netlify.app/user/${props.userid}`)
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div className="homepost--container" onClick={gotoPost} onContextMenu={gotoPostNewWindow}>
      <div className="homepost--top-portion">
        <h3>{props.title}</h3>
        <p onClick={gotoUserProfile} onContextMenu={gotoUserProfileNewWindow} className="user-link">
          {props.username}
        </p>
      </div>

      <div className="homepost--desc">
        <p className="hompost--desc-text">{props.description}</p>
      </div>
    </div>
  )
}