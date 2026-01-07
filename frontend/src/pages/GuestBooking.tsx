import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAvailability, createBooking, type TimeBlock } from '../api';
import { CalendarGrid } from '../components/CalendarGrid';
import { addMinutes, format } from 'date-fns';

export function GuestBooking() {
  const { slug } = useParams(); 
  const [data, setData] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fake date for testing
  const [currentDate] = useState(new Date('2026-01-06T09:00:00'));

  // === MODAL STATE ===
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
        refreshData();
    }
  }, [slug]);

  const refreshData = () => {
    getAvailability(slug!, "2026-01-01", "2026-02-01")
    .then((blocks) => {
        setData(blocks);
        setLoading(false);
    });
  }

  const handleBookSlot = (start: Date) => {
      setSelectedSlot(start); // Opens the modal
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
         <h1 className="text-2xl font-bold mb-2">Book a time with {slug}</h1>
         <CalendarGrid 
            currentDate={currentDate}
            blocks={data}
            isGuest={true}
            onBookSlot={handleBookSlot}
         />
       </div>

       {/* === THE MODAL === */}
       {selectedSlot && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg shadow-xl w-96">
             <h3 className="text-lg font-bold mb-4">Confirm Booking</h3>
             <p className="text-gray-600 mb-4">
               {format(selectedSlot, 'MMMM d, h:mm a')}
             </p>

             <form onSubmit={submitBooking} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Name</label>
                 <input 
                   type="text" 
                   required
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                   value={name}
                   onChange={e => setName(e.target.value)}
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700">Email</label>
                 <input 
                   type="email" 
                   required
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                 />
               </div>

               <div className="flex justify-end gap-2 mt-6">
                 <button 
                   type="button"
                   onClick={() => setSelectedSlot(null)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                 >
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