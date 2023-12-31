import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import CreatePost from './pages/CreatePost'
import './styles/App.css'
import Login from './pages/Login'
import Post from './pages/post/Post'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

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
        <Route path="/user/:id" element={<Profile />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </div>

  )
}

export default App
