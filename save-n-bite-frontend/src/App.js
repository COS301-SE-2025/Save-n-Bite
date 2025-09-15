import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DigitalGarden from './pages/wowFactors/digitalGarden/DigitalGarden';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        
        {/* Digital Garden route */}
        <Route path="/garden" element={<DigitalGarden />} />
        
        {/* Other routes */}
      </Routes>
    </Router>
  );
}