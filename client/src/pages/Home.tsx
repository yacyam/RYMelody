import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HighlightPost } from '../interfaces/Post'
import HomePost from '../components/HomePost'
import '../styles/Home.css'

export default function Home() {
  const [firstPosts, setFirstPosts] = useState<HighlightPost[]>([])

  useEffect(() => {
    fetch('http://localhost:3000/post/all?q=10', {
      method: 'GET'
    })
      .then(res => res.json())
      .then(data => {
        setFirstPosts(data)
      })
  }, [])

  const homePostElements = firstPosts.map((post) => {
    return (
      <HomePost
        key={post.id}
        {...post}
      />
    )
  })

  return (
    <div className='home--container'>
      <Link to="/post/create" className='home--create-post'>+ Create New Post</Link>

      {homePostElements}
    </div>
  )
}