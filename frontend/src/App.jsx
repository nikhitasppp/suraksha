import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Emergency from './pages/Emergency.jsx';
import TripCheckin from './pages/TripCheckin.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/trip" element={<TripCheckin />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </div>
  );
}
