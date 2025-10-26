import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TestDashboard from './pages/TestDashboard';
import LocationDashboard from './pages/LocationDashboard';
import BatchGallery from './pages/BatchGallery';
import BatchAnalysis from './pages/BatchAnalysis';
import Gallery from './pages/Gallery';
import './App.css';

function App() {
  return (
    <Router basename="/dongjeop-service-v2">
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
                <Route path="/" element={<Dashboard />} />
            <Route path="/location-dashboard" element={<LocationDashboard />} />
            <Route path="/batch-analysis" element={<BatchAnalysis />} />
            <Route path="/batch/:batchName" element={<BatchGallery />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

