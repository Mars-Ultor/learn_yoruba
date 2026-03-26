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
import Schedule from './pages/Schedule';
import IntensiveDrill from './pages/IntensiveDrill';
import Techniques from './pages/Techniques';
import Flashcards from './pages/Flashcards';
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
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/drill" element={<IntensiveDrill />} />
            <Route path="/techniques" element={<Techniques />} />
            <Route path="/flashcards" element={<Flashcards />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
