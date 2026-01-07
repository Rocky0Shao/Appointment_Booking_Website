import { type TimeBlock } from '../api'
import { format } from 'date-fns';

interface BookingModalProps {
  booking: TimeBlock;
  onClose: () => void;
  onCancelBooking: (id: string) => void;
}

export function BookingModal({ booking, onClose, onCancelBooking }: BookingModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">Appointment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase">Time</p>
            <p className="text-blue-900">
              {format(new Date(booking.start), 'MMMM d, yyyy')}
              <br />
              {format(new Date(booking.start), 'h:mm a')} - {format(new Date(booking.end), 'h:mm a')}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Guest Name</p>
            <p className="text-lg text-gray-900">{booking.guest_name || "Unknown"}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Contact Email</p>
            <a href={`mailto:${booking.guest_email}`} className="text-blue-600 hover:underline">
              {booking.guest_email || "No email provided"}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
          >
            Close
          </button>
          <button 
            onClick={() => {
              if(confirm('Are you sure you want to cancel this appointment?')) {
                onCancelBooking(booking.id);
              }
            }}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}