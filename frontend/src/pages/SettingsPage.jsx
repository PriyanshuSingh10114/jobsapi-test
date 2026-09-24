import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Key,
  Shield,
  Trash2,
  CheckCircle2,
  Sparkles,
  Save
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const SettingsPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem('jobsapi_base_url') || 'http://localhost:5000/api');
  const [theme, setTheme] = useState(() => localStorage.getItem('jobsapi_theme') || 'light');
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    localStorage.setItem('jobsapi_base_url', apiBaseUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('jobsapi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('jobsapi_theme', 'light');
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('jobsapi_saved_jobs');
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-border-warm">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted">
          Configure visual theme, API keys, telemetry preferences, and local data
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Appearance Settings */}
        <div className="card-warm p-6 sm:p-8 bg-surface space-y-4">
          <h2 className="text-base font-semibold text-charcoal tracking-tight flex items-center gap-2">
            <Sun className="w-4 h-4 text-brand-primary" />
            Appearance & Interface Theme
          </h2>
          <p className="text-xs text-charcoal-muted">
            Select between warm linen light mode and deep forest charcoal dark mode.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-brand-primary bg-brand-subtle text-brand-primary font-semibold shadow-xs'
                  : 'border-border-warm bg-surface-soft text-charcoal'
              }`}
            >
              <Sun className="w-5 h-5 text-warning" />
              <div>
                <div className="text-xs font-semibold">Warm Linen</div>
                <div className="text-[10px] text-charcoal-muted">Light default</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-brand-primary bg-brand-primary/20 text-brand-primary font-semibold shadow-xs'
                  : 'border-border-warm bg-surface-soft text-charcoal'
              }`}
            >
              <Moon className="w-5 h-5 text-brand-secondary" />
              <div>
                <div className="text-xs font-semibold">Deep Forest</div>
                <div className="text-[10px] text-charcoal-muted">Dark canvas</div>
              </div>
            </button>
          </div>
        </div>

        {/* API & Authentication Settings */}
        <div className="card-warm p-6 sm:p-8 bg-surface space-y-4">
          <h2 className="text-base font-semibold text-charcoal tracking-tight flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-primary" />
            API & Authentication Credentials
          </h2>
          <p className="text-xs text-charcoal-muted">
            Configure bearer tokens or customized backend gateway URLs.
          </p>

          <div className="space-y-4 pt-2">
            <Input
              label="Backend Gateway Endpoint"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="http://localhost:5000/api"
            />

            <Input
              label="Authorization Bearer Token (JWT / API Key)"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter bearer token or API key for protected routes..."
            />
          </div>
        </div>

        {/* Data & Cache Management */}
        <div className="card-warm p-6 sm:p-8 bg-surface space-y-4">
          <h2 className="text-base font-semibold text-charcoal tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-primary" />
            Local Cache & Storage
          </h2>
          <p className="text-xs text-charcoal-muted">
            Reset locally bookmarked jobs and temporary search caches.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              icon={Trash2}
            >
              Clear Local Storage & Bookmarks
            </Button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {saved && (
              <span className="text-xs text-success font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
export default SettingsPage;
