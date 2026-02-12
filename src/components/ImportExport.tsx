import React, { useRef, useState } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export const ImportExport: React.FC = () => {
  const { exportConfig, importConfig, resetToDefault } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    try {
      const configJson = exportConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `network-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Configuration exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export configuration' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        importConfig(content);
        setMessage({ type: 'success', text: 'Configuration imported successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Import failed: ${(error as Error).message}`,
        });
        setTimeout(() => setMessage(null), 5000);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset and clear all devices? This will delete all your current devices.'
      )
    ) {
      resetToDefault();
      setMessage({ type: 'success', text: 'All devices cleared' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Export Config</span>
        </button>

        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>Import Config</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Clear All Devices</span>
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <p className="font-semibold mb-2">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Export your configuration to save a backup as a JSON file</li>
          <li>Import a previously saved configuration to restore your network setup</li>
          <li>Clear all devices to start fresh with an empty network</li>
        </ul>
      </div>
    </div>
  );
};
