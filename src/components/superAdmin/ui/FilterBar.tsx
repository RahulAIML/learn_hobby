import React from 'react';
import { Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarFilter {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

interface FilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterBarFilter[];
}

/** Reused across every Super Admin table page: a search box plus 0+ pill-style single-select filters. */
export const FilterBar: React.FC<FilterBarProps> = ({ query, onQueryChange, placeholder = 'Search…', filters = [] }) => (
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
    <div className="relative flex-1">
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
      />
    </div>
    {filters.map((filter, idx) => (
      <div key={idx} className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto">
        {filter.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => filter.onChange(opt.value)}
            className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
              filter.value === opt.value ? 'bg-red-50 text-red-800 border-red-200' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ))}
  </div>
);
