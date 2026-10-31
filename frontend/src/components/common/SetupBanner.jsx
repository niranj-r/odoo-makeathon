import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabase';

export const SetupBanner = () => {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="setup-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <AlertTriangle size={18} />
        <span>
          <strong>Supabase Setup Required:</strong> Populate <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>frontend/.env</code> to enable live authentication.
        </span>
      </div>
    </div>
  );
};

export default SetupBanner;

