import { useState, useEffect } from 'react';
import { NetworkProvider } from './context/NetworkContext';
import { DeviceTable } from './components/DeviceTable';
import { DeviceForm } from './components/DeviceForm';
import { NetworkDiagram } from './components/NetworkDiagram';
import { ImportExport } from './components/ImportExport';
import type { Device } from './types/network';
import { Plus, Sun, Moon, LayoutList, Network as NetworkIcon } from 'lucide-react';

type ViewMode = 'table' | 'diagram';

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddDevice = () => {
    setEditingDevice(undefined);
    setShowForm(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDevice(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Home Network Planner
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and visualize your home network devices
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutList className="w-5 h-5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('diagram')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'diagram'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <NetworkIcon className="w-5 h-5" />
                <span>Network Diagram</span>
              </button>
            </div>

            <button
              onClick={handleAddDevice}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Device</span>
            </button>
          </div>

          {/* Import/Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Configuration Management
            </h2>
            <ImportExport />
          </div>

          {/* Main View */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {viewMode === 'table' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Devices
                </h2>
                <DeviceTable onEditDevice={handleEditDevice} />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Network Topology
                </h2>
                <NetworkDiagram />
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Tip:</strong> Drag devices to rearrange the network diagram. Animated
                    lines represent WiFi connections, solid lines represent wired Ethernet
                    connections.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Device Form Modal */}
      {showForm && <DeviceForm device={editingDevice} onClose={handleCloseForm} />}
    </div>
  );
}

function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}

export default App;
