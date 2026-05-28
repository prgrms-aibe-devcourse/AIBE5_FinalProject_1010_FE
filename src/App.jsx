import { HashRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import CursorEffects from './components/layout/CursorEffects.jsx'
import BgShapes from './components/layout/BgShapes.jsx'

import HomePage from './pages/home/HomePage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import SearchPage from './pages/search/SearchPage.jsx'
import CourseDetailPage from './pages/search/CourseDetailPage.jsx'
import ClassroomPage from './pages/classroom/ClassroomPage.jsx'

export default function App() {
  return (
    <HashRouter>
      <CursorEffects />
      <BgShapes />

      <Routes>
        <Route path="/" element={<WithChrome><HomePage /></WithChrome>} />
        <Route path="/search" element={<WithChrome><SearchPage /></WithChrome>} />
        <Route path="/courses/:id" element={<WithChrome><CourseDetailPage /></WithChrome>} />
        <Route path="/qna" element={<WithChrome><HomePage /></WithChrome>} />
        <Route path="/ai" element={<WithChrome><HomePage /></WithChrome>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/classroom" element={<ClassroomPage />} />
      </Routes>
    </HashRouter>
  )
}

function WithChrome({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}