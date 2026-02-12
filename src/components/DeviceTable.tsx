import React, { useState, useMemo } from 'react';
import type { Device, DeviceType } from '../types/network';
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_COLORS } from '../types/network';
import { useNetwork } from '../context/NetworkContext';
import { Pencil, Trash2, AlertTriangle, ArrowUpDown } from 'lucide-react';

type SortField = 'ipAddress' | 'name' | 'type';
type SortDirection = 'asc' | 'desc';

interface DeviceTableProps {
  onEditDevice: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ onEditDevice }) => {
  const { devices, deleteDevice, getIPConflicts, getDevice } = useNetwork();
  const [sortField, setSortField] = useState<SortField>('ipAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<DeviceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ipConflicts = getIPConflicts();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredDevices = useMemo(() => {
    let filtered = devices;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((device) => device.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(query) ||
          device.ipAddress.includes(query) ||
          device.notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      if (sortField === 'ipAddress') {
        const aOctet = parseInt(a.ipAddress.split('.')[3]);
        const bOctet = parseInt(b.ipAddress.split('.')[3]);
        compareValue = aOctet - bOctet;
      } else if (sortField === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortField === 'type') {
        compareValue = a.type.localeCompare(b.type);
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [devices, sortField, sortDirection, filterType, searchQuery]);

  const getConnectionInfo = (device: Device): string => {
    if (!device.connectionPoint) return 'Not connected';

    const parent = device.connectionPoint.parentDeviceId
      ? getDevice(device.connectionPoint.parentDeviceId)
      : null;

    if (!parent) return device.connectionPoint.connectionType;

    const port = parent.networkDevice?.ports.find(
      (p) => p.id === device.connectionPoint?.portId
    );

    return `${parent.name} - ${port?.name || 'Unknown Port'}`;
  };

  const deviceTypes: (DeviceType | 'all')[] = [
    'all',
    'router',
    'switch',
    'computer',
    'entertainment',
    'mobile',
    'iot',
    'vehicle',
    'other',
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DeviceType | 'all')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {deviceTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : DEVICE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('ipAddress')}
              >
                <div className="flex items-center gap-2">
                  IP Address
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Device Name
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Connection
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAndFilteredDevices.map((device) => {
              const hasConflict = ipConflicts.has(device.ipAddress);
              return (
                <tr
                  key={device.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    hasConflict ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {device.ipAddress}
                      </span>
                      {hasConflict && (
                        <span title="IP Conflict">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{device.name}</div>
                    {device.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {device.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        DEVICE_TYPE_COLORS[device.type]
                      }`}
                    >
                      {DEVICE_TYPE_LABELS[device.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {getConnectionInfo(device)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEditDevice(device)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" aria-label="Edit" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${device.name}?`)) {
                          deleteDevice(device.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" aria-label="Delete" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredDevices.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No devices found
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedAndFilteredDevices.length} of {devices.length} devices
      </div>
    </div>
  );
};
