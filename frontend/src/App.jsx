import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PhotoCollection from './pages/PhotoCollection';
import ReviewQueue from './pages/ReviewQueue';
import ReviewedList from './pages/ReviewedList';
import HumanReview from './pages/HumanReview';
import './App.css';

// GitHub Pages에서는 basename 필요, 로컬 개발에서는 불필요
const isGitHubPages = window.location.hostname === 'ugiugi0823.github.io';
const basename = isGitHubPages ? '/dongjeop-service-v2' : '';

function App() {
  return (
    <Router basename={basename}>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/photo-collection" element={<PhotoCollection />} />
            <Route path="/review/queue" element={<ReviewQueue />} />
            <Route path="/review/completed" element={<ReviewedList />} />
            <Route path="/review/human" element={<HumanReview />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

