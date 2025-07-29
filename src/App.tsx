import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

interface FormData {
  fullName: string;
  phone: string;
  age: string;
  selectedClass: {
    day: string;
    time: string;
    class: string;
    specificDate: string;
  } | null;
}

interface ScheduleSlot {
  time: string;
  class: string;
  available: boolean;
}

interface ClassOption {
  day: string;
  time: string;
  class: string;
  available: boolean;
}

const scheduleData: Record<string, ScheduleSlot[]> = {
  Monday: [
    { time: '6:00 PM to 6:50 PM', class: 'KIDS GI 10 - 15', available: true },
    { time: '7:00 PM to 8:30 PM', class: 'ADULT GI', available: true }
  ],
  Tuesday: [
    { time: '5:00 PM to 5:45 PM', class: 'KIDS GI 3 - 5', available: true },
    { time: '6:00 PM to 6:50 PM', class: 'KIDS GI 6 - 9', available: true },
    { time: '7:00 PM to 8:30 PM', class: 'ADULT GI', available: true }
  ],
  Wednesday: [
    { time: '6:00 PM to 6:50 PM', class: 'KIDS GI 10 - 15', available: true },
    { time: '7:00 PM to 8:30 PM', class: 'ADULT NO GI', available: true }
  ],
  Thursday: [
    { time: '5:00 PM to 5:45 PM', class: 'KIDS GI 3 - 5', available: true },
    { time: '6:00 PM to 6:50 PM', class: 'KIDS GI 6 - 9', available: true },
    { time: '7:00 PM to 8:30 PM', class: 'ADULT GI', available: true }
  ],
  Friday: [
    { time: 'All Day', class: 'CLOSED', available: false }
  ],
  Saturday: [
    { time: '9:00 AM to 9:50 AM', class: 'KIDS NO GI 6 - 15', available: true },
  ],
  Sunday: [
    { time: 'All Day', class: 'CLOSED', available: false }
  ]
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Function to get next 15 occurrences of a specific day
const getNext15Dates = (dayName: string, timeSlot: string): string[] => {
  const today = new Date();
  const dates: string[] = [];
  const dayIndex = days.indexOf(dayName);
  
  let currentDate = new Date(today);
  let found = 0;
  
  // Find next 15 occurrences of the selected day
  while (found < 15) {
    if (currentDate.getDay() === dayIndex) {
      const dateStr = currentDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
      
      // Extract time range for display
      let timeDisplay = timeSlot;
      if (timeSlot.includes('5:00 PM to 5:45 PM')) timeDisplay = '5pm-5:45pm';
      else if (timeSlot.includes('6:00 PM to 6:50 PM')) timeDisplay = '6pm-6:50pm';
      else if (timeSlot.includes('7:00 PM to 8:30 PM')) timeDisplay = '7pm-8:30pm';
      else if (timeSlot.includes('9:00 AM to 9:50 AM')) timeDisplay = '9am-9:50am';
      
      dates.push(`${dateStr} (${timeDisplay})`);
      found++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

function App() {
  const [currentStep, setCurrentStep] = useState<'schedule' | 'details' | 'confirmation'>('schedule');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    age: '',
    selectedClass: null
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Get all available classes
  const getAvailableClasses = (): ClassOption[] => {
    const classes: ClassOption[] = [];
    
    days.forEach(day => {
      scheduleData[day].forEach(slot => {
        if (slot.available) {
          classes.push({
            day,
            time: slot.time,
            class: slot.class,
            available: slot.available
          });
        }
      });
    });
    
    return classes;
  };

  const handleClassSelection = (classOption: ClassOption) => {
    const dates = getNext15Dates(classOption.day, classOption.time);
    setAvailableDates(dates);
    setFormData(prev => ({
      ...prev,
      selectedClass: {
        day: classOption.day,
        time: classOption.time,
        class: classOption.class,
        specificDate: ''
      }
    }));
    setCurrentStep('details');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'specificDate') {
      setFormData(prev => ({
        ...prev,
        selectedClass: prev.selectedClass ? {
          ...prev.selectedClass,
          specificDate: value
        } : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setCurrentStep('confirmation');
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      age: '',
      selectedClass: null
    });
    setAvailableDates([]);
    setCurrentStep('schedule');
  };

  // Schedule Selection Step
  if (currentStep === 'schedule') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white text-black py-6 px-4 border-b border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://essenciajj.com/wp-content/uploads/elementor/thumbs/LOGO-ESSENCIA-qjeyis83xh5slrcn7dmtugc7v7ai3ws1g1v29fw7b4.png" 
                alt="Essência BJJ Academy Logo" 
                className="h-12 w-auto mr-3"
              />
              <h1 className="text-2xl md:text-3xl font-bold text-black">
                Essência BJJ Academy
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Welcome to Essência BJJ – Schedule Your Free Trial Class
            </p>
          </div>
        </header>

        {/* Schedule Selection */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8 flex items-center justify-center">
              <Calendar className="w-6 h-6 mr-2 text-red-600" />
              Choose Your Class
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getAvailableClasses().map((classOption, index) => (
                <div
                  key={index}
                  onClick={() => handleClassSelection(classOption)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-red-600 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600">
                      {classOption.day}
                    </div>
                    <div className="text-red-600 font-semibold mb-3">
                      {classOption.class}
                    </div>
                    <div className="text-gray-600 text-sm flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {classOption.time}
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <ArrowRight className="w-5 h-5 mx-auto text-gray-400 group-hover:text-red-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Personal Details Step
  if (currentStep === 'details') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white text-black py-6 px-4 border-b border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://essenciajj.com/wp-content/uploads/elementor/thumbs/LOGO-ESSENCIA-qjeyis83xh5slrcn7dmtugc7v7ai3ws1g1v29fw7b4.png" 
                alt="Essência BJJ Academy Logo" 
                className="h-12 w-auto mr-3"
              />
              <h1 className="text-2xl md:text-3xl font-bold text-black">
                Essência BJJ Academy
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Complete Your Registration
            </p>
          </div>
        </header>

        <section className="py-8 px-4">
          <div className="max-w-md mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setCurrentStep('schedule')}
              className="flex items-center text-gray-600 hover:text-red-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schedule
            </button>

            {/* Selected Class Summary */}
            {formData.selectedClass && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Selected Class:</h3>
                <div className="text-sm text-gray-700">
                  <div><strong>{formData.selectedClass.day}</strong> - {formData.selectedClass.class}</div>
                  <div className="flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {formData.selectedClass.time}
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8 flex items-center justify-center">
              <Users className="w-6 h-6 mr-2 text-red-600" />
              Your Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  required
                  min="3"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label htmlFor="specificDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Specific Date *
                </label>
                <select
                  id="specificDate"
                  name="specificDate"
                  required
                  value={formData.selectedClass?.specificDate || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a date</option>
                  {availableDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!formData.fullName || !formData.phone || !formData.age || !formData.selectedClass?.specificDate}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Complete Registration
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-4">
              * Required fields
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Confirmation Step
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="mx-auto w-16 h-16 text-red-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Thanks for Registering!
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Registration Details:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div><strong>Name:</strong> {formData.fullName}</div>
            <div><strong>Phone:</strong> {formData.phone}</div>
            <div><strong>Age:</strong> {formData.age}</div>
            {formData.selectedClass && (
              <>
                <div><strong>Class:</strong> {formData.selectedClass.class}</div>
                <div><strong>Day:</strong> {formData.selectedClass.day}</div>
                <div><strong>Time:</strong> {formData.selectedClass.time}</div>
                <div><strong>Date:</strong> {formData.selectedClass.specificDate}</div>
              </>
            )}
          </div>
        </div>
        <p className="text-gray-600 mb-6">
          We'll contact you soon to confirm your spot for the free trial class.
        </p>
        <button
          onClick={resetForm}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Register Another Student
        </button>
      </div>
    </div>
  );
}

export default App;