import { useEffect, useState } from 'react';
import { getAvailability, type TimeBlock , deleteTimeBlock} from './api';
import { CalendarGrid } from './components/CalendarGrid';
function App() {
  const [data, setData] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings
  const HOST_SLUG = "test-host"; 
  // Important: We need a "Current Date" to know which week to show.
  // Since your test data is in 2026, let's pretend today is 2026!
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-06T09:00:00')); 

  useEffect(() => {
    // Fetch a wide range around our fake "current date"
    const start = "2026-01-01";
    const end = "2026-02-01";

    getAvailability(HOST_SLUG, start, end)
      .then((blocks) => {
        setData(blocks);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
      const success = await deleteTimeBlock(id);
      if (success) {
        // Optimistic UI update: Remove it from the screen immediately
        setData(prev => prev.filter(b => b.id !== id));
      } else {
        alert("Failed to delete block");
      }
    };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Host Availability</h1>
          <div className="text-sm text-gray-500">
            Viewing week of {currentDate.toDateString()}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading calendar...</div>
        ) : (
        <CalendarGrid 
              currentDate={currentDate} 
              blocks={data} 
              onDeleteBlock={handleDelete} // <--- Pass it here
            />
        )}
      </div>
    </div>
  );
}

export default App;