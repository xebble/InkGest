'use client';



interface BookingHeaderProps {
  storeName: string;
  companyName: string;
}

export function BookingHeader({ storeName, companyName }: BookingHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        Book Your Appointment
      </h1>
      <p className="text-lg text-gray-600 mb-1">
        {storeName}
      </p>
      <p className="text-sm text-gray-500">
        {companyName}
      </p>
      <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
    </div>
  );
}