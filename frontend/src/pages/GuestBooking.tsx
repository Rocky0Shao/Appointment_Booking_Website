import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';


import { getAvailability, createBooking, type TimeBlock } from '../api';
import { CalendarGrid } from '../components/CalendarGrid';
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, addMinutes } from 'date-fns';
export function GuestBooking() {
  const { slug } = useParams(); 
  const [data, setData] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fake date for testing
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-06T09:00:00'));

  // === MODAL STATE ===
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) refreshData();
  }, [slug, currentDate]); // <--- Re-run when date changes

  const refreshData = () => {
    setLoading(true);
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    getAvailability(slug!, start.toISOString(), end.toISOString())
    .then((blocks) => {
        setData(blocks);
        setLoading(false);
    });
  }
  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
const handleBookSlot = (start: Date, end: Date) => {
      setSelectedSlot(start);
      setEndTime(end); // <--- THIS WAS MISSING OR UNUSED
  };

  const submitBooking = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSlot || !slug) return;

      setIsSubmitting(true);
      const end = addMinutes(selectedSlot, 30); // Default 30 min duration

      const success = await createBooking(
          slug, 
          selectedSlot.toISOString(), 
          end.toISOString(), 
          name, 
          email
      );

      if (success) {
          alert("Booking Confirmed!");
          setSelectedSlot(null); // Close modal
          setName(""); // Reset form
          setEmail("");
          refreshData(); // Re-fetch grid to see the new Blue block!
      } else {
          alert("Failed to book. Slot might be taken.");
      }
      setIsSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
       <div className="max-w-6xl mx-auto">
         
         {/* === NEW HEADER === */}
         <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold">Book with {slug}</h1>
                <p className="text-gray-500 text-sm">Select a time below</p>
            </div>
            
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
            </div>
         </div>

         {loading ? (
             <div className="text-center py-20 text-gray-400">Checking availability...</div>
         ) : (
            <CalendarGrid 
                currentDate={currentDate}
                blocks={data}
                isGuest={true}
                onBookSlot={handleBookSlot}
            />
         )}
       </div>

       {/* ... Keep the Modal code exactly the same ... */}
       {selectedSlot && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {/* ... modal content ... */}
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-lg font-bold mb-4">Confirm Booking</h3>
                <p className="text-gray-600 mb-4">
                    {format(selectedSlot, 'MMMM d, h:mm a')} - {endTime && format(endTime, 'h:mm a')}
                </p>
                <form onSubmit={submitBooking} className="space-y-4">
                    {/* ... inputs for name/email ... */}
                    <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input type="text" required className="mt-1 block w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" required className="mt-1 block w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setSelectedSlot(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? "Booking..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
         </div>
       )}
    </div>
  );
}