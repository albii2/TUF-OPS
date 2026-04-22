import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OwnerDashboard from './pages/OwnerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/owner-dashboard" />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
