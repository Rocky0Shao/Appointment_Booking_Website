// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HostDashboard } from './pages/HostDashboard';
import { GuestBooking } from './pages/GuestBooking';
import { LoginPage } from './pages/LoginPage'; // <--- Import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HostDashboard />} />
        <Route path="/login" element={<LoginPage />} /> {/* <--- New Route */}
        <Route path="/book/:slug" element={<GuestBooking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;