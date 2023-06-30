import { useEffect, useState } from 'react'
import { HighlightPost } from '../interfaces/Post'
import HomePost from '../components/HomePost'
import Tags from '../components/Tags'
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
  const [allTags, setAllTags] = useState<{ tags: string[] }>({ tags: [] })

  function queryStringCreate() {
    const numPost = `?q=${formQuery.numPosts}`
    const searchQ = `search=${formQuery.search}`
    const newestQ = "newest=" + (formQuery.newest ? "true" : "false")
    const oldestQ = "oldest=" + (formQuery.oldest ? "true" : "false")
    const likesQ = "likes=" + (formQuery.likes ? "true" : "false")

    const fullTags = allTags.tags.reduce((prev, curr) => {
      return prev + "&" + "tags=" + curr
    }, "&")

    const fullQuery = numPost + "&" + searchQ + "&" + newestQ + "&" + oldestQ + "&" + likesQ + fullTags

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

        <h2>Filters</h2>

        <h4>Sort By</h4>
        <form className='home--query-form'>

          <label>Newest</label>
          <input className="newest--query" name="newest" type="checkbox" checked={formQuery.newest} onChange={updateSortQuery} />


          <label>Oldest</label>
          <input className="oldest--query" name="oldest" type="checkbox" checked={formQuery.oldest} onChange={updateSortQuery} />

          <label>Likes</label>
          <input className="likes--query" id="likes" name="likes" type="checkbox" checked={formQuery.likes} onChange={updateSortQuery} />
        </form>

        <h4>Genres</h4>
        <div className='home--genre-query'>
          <Tags
            style=""
            tags={allTags.tags}
            updateTag={setAllTags}
          />
        </div>

      </div>
    </div>
  )
}