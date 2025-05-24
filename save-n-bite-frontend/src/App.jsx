import React from 'react';
import logo from './assets/images/SnB_leaf_icon.png';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Home from './pages/auth/Home';

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Register />} /> */}
        <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;

