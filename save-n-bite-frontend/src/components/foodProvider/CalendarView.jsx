import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/foodProvider/Button'

const CalendarView = ({ 
  currentDate, 
  pickups, 
  onMonthChange 
}) => {
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPickupsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pickups.filter(pickup => pickup.pickupDate === dateStr);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"></div>);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayPickups = getPickupsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    days.push(
      <div 
        key={day} 
        className={`h-32 border border-gray-200 dark:border-gray-700 p-2 ${isToday ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-900'}`}
      >
        <div className={`font-medium text-sm mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayPickups.slice(0, 3).map(pickup => (
            <div
              key={pickup.id}
              className={`text-xs p-1 rounded truncate ${
                pickup.status === 'Active' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' :
                pickup.status === 'Upcoming' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300' :
                'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
              }`}
            >
              {pickup.orderNumber}
            </div>
          ))}
          {dayPickups.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">+{dayPickups.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => onMonthChange(-1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={() => onMonthChange(1)}
          >
            Next
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-0 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {days}
      </div>
    </div>
  );
};

export default CalendarView;