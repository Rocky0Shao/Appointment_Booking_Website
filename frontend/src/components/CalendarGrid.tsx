import { format, addDays, startOfWeek, isSameDay, differenceInMinutes, startOfDay } from 'date-fns';
import { type TimeBlock } from '../api';

interface CalendarGridProps {
  currentDate: Date;
  blocks: TimeBlock[];
  onDeleteBlock: (id: string) => void; // <--- New Prop
}

export function CalendarGrid({ currentDate, blocks, onDeleteBlock }: CalendarGridProps) {  // 1. Generate the 7 days of the week based on 'currentDate'
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // 2. Helper: Convert time to pixels (Top position)
  // We assume 1 hour = 64px (h-16 in Tailwind)
  const PIXELS_PER_HOUR = 64;
  
  const getPositionStyles = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const dayStart = startOfDay(startTime);

    // Calculate how many minutes from midnight (00:00)
    const startMinutes = differenceInMinutes(startTime, dayStart);
    const durationMinutes = differenceInMinutes(endTime, startTime);

    return {
      top: `${(startMinutes / 60) * PIXELS_PER_HOUR}px`,
      height: `${(durationMinutes / 60) * PIXELS_PER_HOUR}px`,
    };
  };

  // 3. Generate Time Labels (00:00 to 23:00)
  const timeLabels = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
      
      {/* HEADER: Days of the week */}
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

      {/* BODY: Scrollable Grid */}
      <div className="flex-auto overflow-y-auto relative">
        <div className="grid grid-cols-[60px_1fr] min-h-[1536px]"> {/* 24h * 64px = 1536px */}
          
          {/* LEFT COLUMN: Time Labels */}
          <div className="border-r border-gray-200 bg-gray-50/30 text-xs text-gray-400">
            {timeLabels.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 relative">
                <span className="absolute -top-2 right-2 bg-white px-1">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* MAIN GRID: Days */}
          <div className="grid grid-cols-7 divide-x divide-gray-200 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 grid grid-rows-[repeat(24,minmax(0,1fr))] divide-y divide-gray-100 z-0 pointer-events-none">
               {timeLabels.map(t => <div key={t} className="h-16"></div>)} 
            </div>

            {weekDays.map((day) => {
               // Filter events for this specific day
               const dayBlocks = blocks.filter(b => isSameDay(new Date(b.start), day));

               return (
                <div key={day.toString()} className="relative h-full">
                  {/* Render Events */}
                    {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      // 2. Add Click Handler
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering other clicks
                        if (confirm('Delete this block?')) {
                            onDeleteBlock(block.id);
                        }
                      }}
                      className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border-l-4 overflow-hidden cursor-pointer hover:opacity-80 transition
                        ${block.type === 'blocked' 
                          ? 'bg-red-100 border-red-500 text-red-700' 
                          : 'bg-blue-100 border-blue-500 text-blue-700'}`}
                      style={getPositionStyles(block.start, block.end)}
                    >
                      {/* ... content ... */}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}