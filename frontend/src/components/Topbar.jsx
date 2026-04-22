import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import './Topbar.css';

const COMMODITIES = ['Cereals', 'Oils', 'Sugar', 'Dairy', 'Meat'];

const Topbar = ({ selectedCommodity, setSelectedCommodity }) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="search-container glass-panel">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search country or commodity..."
          className="search-input"
        />
      </div>

      <div className="filters-container glass-panel">
        <div className="filter-dropdown" onClick={() => setFilterOpen(!filterOpen)}>
          <span>Filters</span>
          <ChevronDown size={14} />
          {filterOpen && (
            <div className="dropdown-menu glass-panel">
              <div className="dropdown-item">Global</div>
              <div className="dropdown-item">North America</div>
              <div className="dropdown-item">Europe</div>
              <div className="dropdown-item">Asia</div>
            </div>
          )}
        </div>

        <div className="commodity-tags">
          {COMMODITIES.map((c) => (
            <span
              key={c}
              className={`tag ${c.toLowerCase()} ${selectedCommodity === c ? 'active' : ''}`}
              onClick={() => setSelectedCommodity && setSelectedCommodity(c)}
            >
              {c === 'Cereals' && '🌾'}
              {c === 'Oils' && '💧'}
              {c === 'Sugar' && '🍬'}
              {c === 'Dairy' && '🥛'}
              {c === 'Meat' && '🥩'}
              {' '}{c}
            </span>
          ))}
        </div>

        <button className="settings-btn">
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;