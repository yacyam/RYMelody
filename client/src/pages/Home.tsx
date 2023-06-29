import { useEffect, useState } from 'react'
import { HighlightPost } from '../interfaces/Post'
import HomePost from '../components/HomePost'
import '../styles/pages/Home.css'

export default function Home() {
  const [firstPosts, setFirstPosts] = useState<HighlightPost[]>([])
  const [numPosts, setNumPosts] = useState(8)
  const [formQuery, setFormQuery] = useState({
    numPosts: 10,
    search: "",
    newest: false,
    oldest: false,
    likes: false
  })

  function queryStringCreate() {
    const numPost = `?q=${formQuery.numPosts}`
    const searchQ = `search=${formQuery.search}`
    const newestQ = "newest=" + (formQuery.newest ? "true" : "false")
    const oldestQ = "oldest=" + (formQuery.oldest ? "true" : "false")
    const likesQ = "likes=" + (formQuery.likes ? "true" : "false")

    const fullQuery = numPost + "&" + searchQ + "&" + newestQ + "&" + oldestQ + "&" + likesQ

    return fullQuery
  }

  const queryString = queryStringCreate()

  useEffect(() => {
    fetch(`http://localhost:3000/post/all${queryString}`, {
      method: 'GET'
    })
      .then(res => res.json())
      .then(data => {
        setFirstPosts(data)
      })
  }, [queryString])

  const homePostElements = firstPosts.map((post) => {
    return (
      <HomePost
        key={post.id}
        {...post}
      />
    )
  })

  function updateSearchQuery(e: React.SyntheticEvent) {
    const { value } = e.target as HTMLInputElement

    setFormQuery(oldFormQuery => {
      return {
        ...oldFormQuery,
        search: value
      }
    })
  }

  function updateSortQuery(e: React.SyntheticEvent) {
    const { name, checked } = e.target as HTMLInputElement

    setFormQuery(oldFormQuery => {
      const allReset = {
        newest: false,
        oldest: false,
        likes: false
      }
      return {
        ...oldFormQuery,
        ...allReset,
        [name]: checked
      }
    })
  }

  return (
    <div className='home--main'>
      <div className='home--left'>
        <div className='home--post-container'>
          {homePostElements}
        </div>
        {numPosts <= homePostElements.length ?
          <button onClick={() => setNumPosts(oldNum => oldNum + 8)}>
            See More Posts
          </button>
          :
          <p className='home--left-no-posts'>no more posts</p>
        }
      </div>

      <div className='home--query'>
        <h2>Search</h2>
        <input name="search" type="text" value={formQuery.search} onChange={updateSearchQuery} />

        <h4>Sort By</h4>
        <form className='home--query-form'>

          <label>Newest</label>
          <input name="newest" type="radio" checked={formQuery.newest} onChange={updateSortQuery} />


          <label>Oldest</label>
          <input name="oldest" type="radio" checked={formQuery.oldest} onChange={updateSortQuery} />

          <label>Likes</label>
          <input id="likes" name="likes" type="radio" checked={formQuery.likes} onChange={updateSortQuery} />

          <label>Hip Hop</label>
          <input name="hiphop" type="checkbox" />
        </form>



      </div>
    </div>
  )
}