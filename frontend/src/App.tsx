import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HostDashboard } from './pages/HostDashboard';
import { GuestBooking } from './pages/GuestBooking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* URL: / -> Show Host Dashboard */}
        <Route path="/" element={<HostDashboard />} />
        
        {/* URL: /book/john-doe -> Show Guest Booking Page */}
        <Route path="/book/:slug" element={<GuestBooking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;