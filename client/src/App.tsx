import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Navbar from './pages/Navbar'
import CreatePost from './pages/CreatePost'
import './styles/App.css'
import Login from './pages/Login'
import Post from './pages/Post'

function App() {

  return (
    <div className='app--container'>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/create" element={<CreatePost />} />
        <Route path="/post/:id" element={<Post />} />
      </Routes>
    </div>

  )
}

export default App
