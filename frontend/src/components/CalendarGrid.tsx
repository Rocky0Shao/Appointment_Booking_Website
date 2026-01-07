import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, differenceInMinutes, startOfDay, addMinutes, roundToNearestMinutes } from 'date-fns';
import { type TimeBlock } from '../api';

interface CalendarGridProps {
  currentDate: Date;
  blocks: TimeBlock[];
  onDeleteBlock?: (id: string) => void;
  onAddBlock?: (start: Date, end: Date) => void;
  isGuest?: boolean;
  // FIX 1: Update interface to expect start AND end
  onBookSlot?: (start: Date, end: Date) => void; 
  onSelectBooking?: (booking: TimeBlock) => void;
}

export function CalendarGrid({ currentDate, blocks, onDeleteBlock, onAddBlock, isGuest, onBookSlot, onSelectBooking }: CalendarGridProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const timeLabels = Array.from({ length: 24 }).map((_, i) => i);
  const PIXELS_PER_HOUR = 64;

  // ... (Keep existing dragging state & handlers exactly the same) ...
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);

  const getTimeFromClick = (e: React.MouseEvent, dayDate: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hours = offsetY / PIXELS_PER_HOUR;
    const minutes = hours * 60;
    const baseTime = startOfDay(dayDate);
    const exactTime = addMinutes(baseTime, minutes);
    return roundToNearestMinutes(exactTime, { nearestTo: 30 });
  };

  const handleMouseDown = (e: React.MouseEvent, day: Date) => {
    if (isGuest) return;
    if (e.button !== 0) return;
    e.preventDefault();
    const time = getTimeFromClick(e, day);
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(addMinutes(time, 30));
  };

  const handleMouseEnter = (e: React.MouseEvent, day: Date) => {
    if (!isDragging || !dragStart) return;
    const time = getTimeFromClick(e, day);
    if (isSameDay(time, dragStart)) {
        setDragEnd(time);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
        let start = dragStart;
        let end = dragEnd;
        if (start.getTime() === end.getTime()) {
           end = addMinutes(start, 30);
        }
        onAddBlock?.(start, end);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

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
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm select-none"
         onMouseUp={handleMouseUp} 
    >
      {/* ... (Header code remains the same) ... */}
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
          {/* ... (Time Labels remain the same) ... */}
          <div className="border-r border-gray-200 bg-gray-50/30 text-xs text-gray-400">
            {timeLabels.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 relative">
                <span className="absolute -top-2 right-2 bg-white px-1">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-gray-200 relative">
             <div className="absolute inset-0 grid grid-rows-[repeat(24,minmax(0,1fr))] divide-y divide-gray-100 z-0 pointer-events-none">
                {timeLabels.map(t => <div key={t} className="h-16"></div>)} 
             </div>

            {weekDays.map((day) => {
               const dayBlocks = blocks.filter(b => isSameDay(new Date(b.start), day));
               
            return (
              <div 
                key={day.toString()} 
                className={`relative h-full border-r border-gray-100 ${isGuest ? 'cursor-default' : 'cursor-crosshair hover:bg-gray-50'}`}
                onMouseDown={(e) => handleMouseDown(e, day)}
                onMouseMove={(e) => handleMouseEnter(e, day)}
                
                // FIX 2: Calculate end time and pass 2 args to onBookSlot
                onClick={(e) => {
                    if (isGuest && onBookSlot) {
                        const start = getTimeFromClick(e, day);
                        const end = addMinutes(start, 30); // Default 30 min booking
                        onBookSlot(start, end);
                    }
                }}
              >
                {/* ... (Block rendering remains the same) ... */}
                {dayBlocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (block.type === 'booking' && onSelectBooking) {
                            onSelectBooking(block);
                        } else if (!isGuest && onDeleteBlock) {
                            if (confirm('Delete this blocked time?')) onDeleteBlock(block.id);
                        }
                      }}
                    onMouseDown={(e) => e.stopPropagation()} 
                    className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border-l-4 overflow-hidden z-10 shadow-sm
                      ${isGuest ? 'cursor-default' : 'cursor-pointer'} 
                      ${block.type === 'blocked' 
                        ? isGuest 
                          ? 'bg-gray-100 border-gray-400 text-gray-500' 
                          : 'bg-red-100 border-red-500 text-red-700' 
                        : 'bg-blue-100 border-blue-500 text-blue-700'}` 
                    }
                    style={getPositionStyles(block.start, block.end)}
                  >
                    <div className="font-semibold">{block.title}</div>
                    <div>{format(new Date(block.start), 'h:mm a')}</div>
                  </div>
                ))}

                {isDragging && dragStart && dragEnd && isSameDay(day, dragStart) && (
                  <div 
                    className="absolute left-1 right-1 rounded bg-blue-500/30 border-2 border-blue-600 z-20 pointer-events-none"
                    style={getPositionStyles(dragStart, dragEnd)}
                  >
                    <div className="text-xs font-bold text-blue-800 p-1">
                        {format(dragStart, 'h:mm')} - {format(dragEnd, 'h:mm')}
                    </div>
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