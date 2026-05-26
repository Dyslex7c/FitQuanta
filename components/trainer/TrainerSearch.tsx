'use client';

import React, { useState, useEffect } from 'react';

interface TrainerSearchProps {
  value: string;
  onSearch: (query: string) => void;
}

export default function TrainerSearch({ value, onSearch }: TrainerSearchProps) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', gap: '8px' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#545870', fontSize: '13px' }}>
          🔍
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search trainers by name, certifications, bios..."
          className="input"
          style={{ paddingLeft: '40px', fontSize: '13px' }}
        />
        {input.length > 0 && (
          <button
            type="button"
            onClick={() => { setInput(''); onSearch(''); }}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 0,
              color: '#545870',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', fontSize: '12px', fontWeight: 600 }}>
        Search
      </button>
    </form>
  );
}
