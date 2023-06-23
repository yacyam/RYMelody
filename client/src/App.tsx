import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Navbar from './pages/Navbar'
import CreatePost from './pages/CreatePost'
import './styles/App.css'
import Login from './pages/Login'

function App() {

  return (
    <div className='app--container'>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/create" element={<CreatePost />} />
      </Routes>
    </div>

  )
}

export default App
