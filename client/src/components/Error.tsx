import { MsgErr } from "../interfaces/Error"
import "../styles/components/Error.css"

interface PropTypes {
  errors: MsgErr
}

export default function Errors(props: PropTypes) {
  const displayErrors = props.errors.map((err, i) => {
    return <li className="error--msg" key={i}>{err.message}</li>
  })

  return (
    <div className="error--container">
      <ul className="error-list">
        {displayErrors}
      </ul>
    </div>
  )
}