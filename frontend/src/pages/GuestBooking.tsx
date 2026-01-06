import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAvailability, type TimeBlock } from '../api';
import { CalendarGrid } from '../components/CalendarGrid';
import { addMinutes, format } from 'date-fns';

export function GuestBooking() {
  const { slug } = useParams(); 
  const [data, setData] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fake date again for testing (match your data!)
  const [currentDate] = useState(new Date('2026-01-06T09:00:00'));

  useEffect(() => {
    if (slug) {
        getAvailability(slug, "2026-01-01", "2026-02-01")
        .then((blocks) => {
            setData(blocks);
            setLoading(false);
        });
    }
  }, [slug]);

  const handleBookSlot = (start: Date) => {
      // For now, just a simple alert to prove it works
      const end = addMinutes(start, 30);
      alert(`Guest wants to book: ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
       <div className="max-w-6xl mx-auto">
         <h1 className="text-2xl font-bold mb-2">Book a time with {slug}</h1>
         <p className="text-gray-500 mb-6">Click any white slot to request an appointment.</p>
         
         <CalendarGrid 
            currentDate={currentDate}
            blocks={data}
            isGuest={true} // <--- MAGIC FLAG
            onBookSlot={handleBookSlot}
         />
       </div>
    </div>
  );
}