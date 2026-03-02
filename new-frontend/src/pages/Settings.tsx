import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Key, Save } from 'lucide-react';
import { getStoredApiKeyExport, setStoredApiKey } from '../api';

export default function Settings() {
  const [apikey, setApikey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApikey(getStoredApiKeyExport());
  }, []);

  const handleSave = () => {
    setStoredApiKey(apikey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
            <Key className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
            <p className="text-xs text-gray-500 mb-2">
              Used for course generation and exam generation. Stored only in your browser. You can also set
              GEMINI_API_KEY on the server.
            </p>
            <input
              type="password"
              value={apikey}
              onChange={(e) => setApikey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-mono text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
