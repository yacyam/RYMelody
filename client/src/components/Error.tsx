import { MsgErr } from "../interfaces/Error"

interface PropTypes {
  errors: MsgErr
}

export default function Errors(props: PropTypes) {
  const displayErrors = props.errors.map((err, i) => {
    return <li key={i}>{err.message}</li>
  })

  return (
    <div>
      <ul>
        {displayErrors}
      </ul>
    </div>
  )
}