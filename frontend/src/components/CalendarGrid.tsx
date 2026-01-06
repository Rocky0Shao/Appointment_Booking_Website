import { useState } from 'react'; // Import useState
import { format, addDays, startOfWeek, isSameDay, differenceInMinutes, startOfDay, addMinutes, roundToNearestMinutes } from 'date-fns';
import { type TimeBlock } from '../api';

interface CalendarGridProps {
  currentDate: Date;
  blocks: TimeBlock[];
  onDeleteBlock?: (id: string) => void; // Make optional (Guests can't delete)
  onAddBlock?: (start: Date, end: Date) => void; // Make optional
  isGuest?: boolean; // <--- NEW PROP
  onBookSlot?: (start: Date) => void; // <--- NEW ACTION for Guests
}

export function CalendarGrid({ currentDate, blocks, onDeleteBlock, onAddBlock, isGuest, onBookSlot }: CalendarGridProps) {  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const timeLabels = Array.from({ length: 24 }).map((_, i) => i);
  const PIXELS_PER_HOUR = 64;

  // ==========================================
  // 1. DRAG STATE
  // ==========================================
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);

  // ==========================================
  // 2. MOUSE EVENT HANDLERS
  // ==========================================
  
  // Helper: Calculate time from mouse Y position
  const getTimeFromClick = (e: React.MouseEvent, dayDate: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top; // How far down inside the column?
    
    // Math: Pixels -> Hours -> Minutes
    const hours = offsetY / PIXELS_PER_HOUR;
    const minutes = hours * 60;
    
    // Add minutes to the start of that day (Midnight)
    const baseTime = startOfDay(dayDate);
    const exactTime = addMinutes(baseTime, minutes);

    // Snap to nearest 30 minutes
    return roundToNearestMinutes(exactTime, { nearestTo: 30 });
  };

  const handleMouseDown = (e: React.MouseEvent, day: Date) => {

    // 🛑 STOP if we are a Guest (Guests just click, they don't drag)
    if (isGuest) return;

    // Only left click triggers drag
    if (e.button !== 0) return; 
    
    e.preventDefault(); // Stop text selection
    const time = getTimeFromClick(e, day);
    
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(addMinutes(time, 30)); // Default min length 30 mins
  };

  const handleMouseEnter = (e: React.MouseEvent, day: Date) => {
    // If we are dragging, update the end time as we move over slots
    if (!isDragging || !dragStart) return;

    // Optional: You could make this smoother by using MouseMove instead of Enter
    const time = getTimeFromClick(e, day);
    
    // We only care if we are on the same day for this V1 implementation
    if (isSameDay(time, dragStart)) {
        setDragEnd(time);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
        // Normalize: Ensure Start is before End
        let start = dragStart;
        let end = dragEnd;
      // If start equals end, the user probably clicked without dragging.
        // We can either ignore it OR force it to be 30 mins.
        if (start.getTime() === end.getTime()) {
           // Option A: Do nothing (cancel action)
           // return; 
           
           // Option B: Force it to be a 30-min block (Better UX)
           end = addMinutes(start, 30);
        }

        // Send to parent
        onAddBlock?.(start, end);
    }
    // Reset
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // ==========================================
  // 3. RENDER HELPERS
  // ==========================================

  const getPositionStyles = (start: string | Date, end: string | Date) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const dayStart = startOfDay(startTime);

    const startMinutes = differenceInMinutes(startTime, dayStart);
    const durationMinutes = differenceInMinutes(endTime, startTime);

    return {
      top: `${(startMinutes / 60) * PIXELS_PER_HOUR}px`,
      height: `${(durationMinutes / 60) * PIXELS_PER_HOUR}px`,
    };
  };

  return (
    // Add Global MouseUp here to catch releasing mouse outside the column
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm select-none"
         onMouseUp={handleMouseUp} 
    >
      {/* HEADER ... (No changes) ... */}
      <div className="grid grid-cols-[60px_1fr] border-b border-gray-200 bg-gray-50 flex-none">
        <div className="p-3 text-xs text-gray-400 border-r border-gray-200 text-center">GMT-5</div>
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {weekDays.map((day) => (
            <div key={day.toString()} className="p-2 text-center">
              <div className="text-xs font-semibold text-gray-500">{format(day, 'EEE')}</div>
              <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-auto overflow-y-auto relative">
        <div className="grid grid-cols-[60px_1fr] min-h-[1536px]">
          
          {/* TIME LABELS ... (No changes) ... */}
          <div className="border-r border-gray-200 bg-gray-50/30 text-xs text-gray-400">
            {timeLabels.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 relative">
                <span className="absolute -top-2 right-2 bg-white px-1">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-7 divide-x divide-gray-200 relative">
             {/* Background Lines */}
            <div className="absolute inset-0 grid grid-rows-[repeat(24,minmax(0,1fr))] divide-y divide-gray-100 z-0 pointer-events-none">
               {timeLabels.map(t => <div key={t} className="h-16"></div>)} 
            </div>

            {weekDays.map((day) => {
               const dayBlocks = blocks.filter(b => isSameDay(new Date(b.start), day));
               
               return (
                <div 
                    key={day.toString()} 
                    className="relative h-full hover:bg-gray-50 transition-colors cursor-crosshair"
                    
                    // 1. Keep Mouse Down (Host Only)
                    onMouseDown={(e) => handleMouseDown(e, day)}
                    
                    // 2. Add Click (Guest Only)
                    onClick={(e) => {
                        if (isGuest && onBookSlot) {
                            const time = getTimeFromClick(e, day);
                            onBookSlot(time);
                        }
                    }}
                    
                >
                  {/* 1. Render Existing Blocks */}
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                        // Disable clicks for guests (No deleting!)
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isGuest && onDeleteBlock) { // <--- Check isGuest
                              if (confirm('Delete this block?')) onDeleteBlock(block.id);
                          }
                        }}
                        // Update classes for colors
                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border-l-4 overflow-hidden z-10
                          ${isGuest ? 'cursor-default' : 'cursor-pointer'} 
                          ${block.type === 'blocked' 
                            ? isGuest 
                              ? 'bg-gray-100 border-gray-400 text-gray-500' // Guest sees Gray
                              : 'bg-red-100 border-red-500 text-red-700'   // Host sees Red
                            : 'bg-blue-100 border-blue-500 text-blue-700'}` // Bookings stay Blue
                        }
                      style={getPositionStyles(block.start, block.end)}
                    >
                      <div className="font-semibold">{block.title}</div>
                      <div>{format(new Date(block.start), 'h:mm a')}</div>
                    </div>
                  ))}

                  {/* 2. Render "Phantom" Drag Selection (The visual preview) */}
                  {isDragging && dragStart && dragEnd && isSameDay(day, dragStart) && (
                     <div 
                        className="absolute left-1 right-1 rounded bg-blue-400/30 border-2 border-blue-500 z-20 pointer-events-none"
                        style={getPositionStyles(dragStart, dragEnd)}
                     >
                     </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}