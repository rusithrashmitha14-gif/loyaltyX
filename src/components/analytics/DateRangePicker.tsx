'use client';

interface DateRangePickerProps {
  value: string;
  onChange: (range: string) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const ranges = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '365d' },
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            value === range.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

