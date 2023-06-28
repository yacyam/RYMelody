interface PropTypes {
  genre: string,
  name: string,
  style: string,
  updateTag: (e: React.SyntheticEvent) => void
}
import "../styles/pages/CreatePost.css"

export default function Tag(props: PropTypes) {

  return (
    <button
      name={props.genre} type='button' className={`tag--select ${props.style}`}
      onClick={props.updateTag}
    >
      {props.name}
    </button>
  )
}