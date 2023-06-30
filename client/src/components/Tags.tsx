import { genres } from "../genreData.json"

interface PropTypes {
  style: string,
  tags: string[],
  updateTag: (value: React.SetStateAction<{ tags: string[] }>) => void
}
import "../styles/pages/CreatePost.css"

export default function Tags(props: PropTypes) {

  function updateTag(e: React.SyntheticEvent): void {
    const { name } = e.target as HTMLInputElement

    props.updateTag(oldFormData => {
      const tagCopy = [...oldFormData.tags]
      const isTagAlready = tagCopy.find((tag) => tag === name)
      let newTags = []
      if (isTagAlready) {
        newTags = tagCopy.filter((tag) => tag !== name)
      } else {
        tagCopy.length === 2 && tagCopy.pop()
        tagCopy.push(name)
        newTags = tagCopy
      }

      return {
        ...oldFormData,
        tags: newTags
      }
    })
  }

  const tagElements = genres.map((hold: string[], i) => {
    const [genre, name] = hold

    const shouldHighlight = props.tags.find((gen) => gen === genre)
    const style = shouldHighlight ? "selected" : "select"

    return <button
      key={i}
      name={genre} type='button' className={`tag--select ${style}`}
      onClick={updateTag}
    >
      {name}
    </button>
  })

  return (
    <>
      {tagElements}
    </>
  )
}