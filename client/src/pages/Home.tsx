import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Home.css'

export default function Home() {
  const [firstPosts, setFirstPosts] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/post/all?q=10', {
      method: 'GET'
    })
      .then(res => res.json())
      .then(data => {
        setFirstPosts(data)
      })
  }, [])

  return (
    <div className='home--container'>
      <Link to="/post/create" className='home--create-post'>+ Create New Post</Link>

      <h1>hi</h1>
      <h2>hi</h2>
    </div>
  )
}