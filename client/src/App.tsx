import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Vocabulary from './pages/Vocabulary';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonDetail />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
