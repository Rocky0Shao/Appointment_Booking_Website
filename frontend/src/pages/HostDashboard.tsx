import { useEffect, useState } from 'react';
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
import { getAvailability, createTimeBlock, type TimeBlock, deleteTimeBlock } from '../api';
import { CalendarGrid } from '../components/CalendarGrid';
import { BookingModal } from '../components/BookingModal';
import { useNavigate } from 'react-router-dom'; // <--- Import this


export function HostDashboard() {
  const [data, setData] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Settings

  // Important: We need a "Current Date" to know which week to show.
  // Since your test data is in 2026, let's pretend today is 2026!
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-06T09:00:00'));
  const [selectedBooking, setSelectedBooking] = useState<TimeBlock | null>(null);
  
  useEffect(() => {
        setLoading(true);
        
        const mySlug = localStorage.getItem('slug'); // <--- Get real slug
        if (!mySlug) return; // Wait until we have a slug

        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });

        // Use mySlug here too!
        getAvailability(mySlug, start.toISOString(), end.toISOString())
          .then((blocks) => {
            setData(blocks);
            setLoading(false);
          });
      }, [currentDate]);
    
  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const handleToday = () => setCurrentDate(new Date('2026-01-06T09:00:00')); // Reset to test date
  const handleCancelBooking = async (id: string) => {
    await deleteTimeBlock(id); // We can reuse the delete API!
    setData(prev => prev.filter(b => b.id !== id));
    setSelectedBooking(null); // Close modal
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTimeBlock(id);
    if (success) {
      // Optimistic UI update: Remove it from the screen immediately
      setData(prev => prev.filter(b => b.id !== id));
    } else {
      alert("Failed to delete block");
    }
  };

  const handleAddBlock = async (start: Date, end: Date) => {
      // 🟢 NEW: Get the real slug from storage
      const mySlug = localStorage.getItem('slug'); 
      
      if (!mySlug) {
          alert("Error: No booking link found. Please re-login.");
          return;
      }

      // 🟢 NEW: Use mySlug instead of HOST_SLUG
      const newBlock = await createTimeBlock(mySlug, start.toISOString(), end.toISOString());

      if (newBlock) {
        setData(prev => [...prev, newBlock]);
      } else {
        alert("Failed to create block");
      }
    };

return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* === NEW HEADER WITH NAVIGATION === */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Host Dashboard</h1>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded shadow-sm border border-gray-200">
             <button onClick={handlePrevWeek} className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600">
               ← Prev
             </button>
             <span className="font-semibold w-32 text-center">
               {format(currentDate, 'MMMM yyyy')}
             </span>
             <button onClick={handleNextWeek} className="px-3 py-1 hover:bg-gray-100 rounded text-gray-600">
               Next →
             </button>
             <button onClick={handleToday} className="ml-2 text-xs text-blue-600 hover:underline">
               Reset
             </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading schedule...</div>
        ) : (
          <CalendarGrid 
             currentDate={currentDate} 
             blocks={data} 
             onDeleteBlock={handleDelete}
             onAddBlock={handleAddBlock}
             onSelectBooking={(b) => setSelectedBooking(b)}
          />
        )}
      </div>

       {selectedBooking && (
          <BookingModal 
             booking={selectedBooking} 
             onClose={() => setSelectedBooking(null)}
             onCancelBooking={handleCancelBooking}
          />
       )}
    </div>
  );
}