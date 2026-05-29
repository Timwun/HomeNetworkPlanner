import React, { useState, useEffect } from 'react';
import type { Device, DeviceType, ConnectionType, Port } from '../types/network';
import { DEVICE_TYPE_LABELS } from '../types/network';
import { useNetwork } from '../context/NetworkContext';
import {
  validateIPAddress,
  getNextAvailableIP,
  buildSlash24Address,
  buildSlash16Address,
  getHostOctetFromIP,
  getThirdOctetFromIP,
  isWideNetworkRange,
  getRangePrefix,
  getNetworkRange,
  NETWORK_RANGES,
  NETWORK_RANGE_GROUPS,
} from '../utils/networkRanges';
import { X, Plus, Trash2 } from 'lucide-react';

interface DeviceFormProps {
  device?: Device;
  onClose: () => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({ device, onClose }) => {
  const { devices, addDevice, updateDevice, hasIPConflict, getDevice, subnet, setSubnet } =
    useNetwork();
  const isEditing = !!device;
  const wideRange = isWideNetworkRange(subnet);

  const initialIP = device?.ipAddress || getNextAvailableIP(devices.map((d) => d.ipAddress), subnet);

  const [formData, setFormData] = useState<Partial<Device>>({
    name: '',
    ipAddress: initialIP,
    type: 'other',
    notes: '',
    ...device,
  });
  const [ipHost, setIpHost] = useState(() => getHostOctetFromIP(initialIP));
  const [ipThird, setIpThird] = useState(() => getThirdOctetFromIP(initialIP));
  const [ipFourth, setIpFourth] = useState(() => getHostOctetFromIP(initialIP));

  const [ipError, setIpError] = useState<string>('');
  const [ports, setPorts] = useState<Port[]>(device?.networkDevice?.ports || []);
  const [newPortName, setNewPortName] = useState('');
  const [newPortType, setNewPortType] = useState<ConnectionType>('ethernet');

  useEffect(() => {
    const ipAddress = wideRange
      ? buildSlash16Address(ipThird, ipFourth)
      : buildSlash24Address(getRangePrefix(getNetworkRange(subnet)), ipHost);
    setFormData((prev) => (prev.ipAddress === ipAddress ? prev : { ...prev, ipAddress }));
  }, [wideRange, ipThird, ipFourth, ipHost, subnet]);

  useEffect(() => {
    if (isEditing) return;

    const nextIP = getNextAvailableIP(devices.map((d) => d.ipAddress), subnet);
    if (wideRange) {
      setIpThird(getThirdOctetFromIP(nextIP));
      setIpFourth(getHostOctetFromIP(nextIP));
    } else {
      setIpHost(getHostOctetFromIP(nextIP));
    }
  }, [subnet, isEditing, devices, wideRange]);

  useEffect(() => {
    if (formData.ipAddress) {
      const validation = validateIPAddress(formData.ipAddress, subnet);
      if (!validation.valid) {
        setIpError(validation.error || '');
      } else if (hasIPConflict(formData.ipAddress, device?.id)) {
        setIpError('IP address is already in use by another device');
      } else {
        setIpError('');
      }
    }
  }, [formData.ipAddress, device?.id, hasIPConflict, subnet]);

  const isNetworkDevice = formData.type === 'router' || formData.type === 'switch' || formData.type === 'access-point';
  
  // Determine if this device type can connect to a parent
  // Routers are typically the root device, but switches and access points connect to routers/switches
  const canConnectToParent = formData.type !== 'router';

  // Get available parent devices (routers, switches, and access points, excluding current device)
  const availableParents = devices.filter(
    (d) =>
      (d.type === 'router' || d.type === 'switch' || d.type === 'access-point') &&
      d.id !== device?.id &&
      d.networkDevice
  );

  const selectedParent = formData.connectionPoint?.parentDeviceId
    ? getDevice(formData.connectionPoint.parentDeviceId)
    : null;

  const availablePorts = selectedParent?.networkDevice?.ports || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (ipError) {
      alert('Please fix the IP address error before saving');
      return;
    }

    if (!formData.name || !formData.ipAddress || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    const deviceData: Device = {
      id: device?.id || `device-${Date.now()}`,
      name: formData.name,
      ipAddress: formData.ipAddress,
      type: formData.type,
      notes: formData.notes,
      connectionPoint: formData.connectionPoint,
      position: device?.position || { x: 400, y: 400 },
      ...(isNetworkDevice && {
        networkDevice: {
          id: device?.id || `device-${Date.now()}`,
          type: formData.type as 'router' | 'switch' | 'access-point',
          ports: ports,
        },
      }),
    };

    if (isEditing) {
      updateDevice(device.id, deviceData);
    } else {
      addDevice(deviceData);
    }

    onClose();
  };

  const addPort = () => {
    if (!newPortName.trim()) return;

    const newPort: Port = {
      id: `port-${Date.now()}`,
      name: newPortName,
      type: newPortType,
    };

    setPorts([...ports, newPort]);
    setNewPortName('');
  };

  const removePort = (portId: string) => {
    setPorts(ports.filter((p) => p.id !== portId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Device' : 'Add Device'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* IP Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IP Address *
            </label>
            {wideRange ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono">
                  10.0
                </span>
                <span className="text-gray-500 dark:text-gray-400">.</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={ipThird}
                  onChange={(e) => setIpThird(e.target.value)}
                  className={`w-24 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    ipError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                <span className="text-gray-500 dark:text-gray-400">.</span>
                <input
                  type="number"
                  min={1}
                  max={255}
                  value={ipFourth}
                  onChange={(e) => setIpFourth(e.target.value)}
                  className={`w-24 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    ipError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  className={`flex-1 min-w-0 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    ipError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {!NETWORK_RANGES.some((range) => range.id === subnet) && (
                    <option value={subnet}>{getNetworkRange(subnet).label}</option>
                  )}
                  {NETWORK_RANGE_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {NETWORK_RANGES.filter(
                        (range) => range.group === group && !range.id.endsWith('/16'),
                      ).map((range) => (
                        <option key={range.id} value={range.id}>
                          {range.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="text-gray-500 dark:text-gray-400">.</span>
                <input
                  type="number"
                  min={1}
                  max={254}
                  value={ipHost}
                  onChange={(e) => setIpHost(e.target.value)}
                  className={`w-24 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    ipError
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Full address: {formData.ipAddress}
            </p>
            {ipError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{ipError}</p>}
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Network Device Ports (for routers and switches) */}
          {isNetworkDevice && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Network Ports
              </h3>

              <div className="space-y-2 mb-4">
                {ports.map((port) => (
                  <div
                    key={port.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {port.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({port.type})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePort(port.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPortName}
                  onChange={(e) => setNewPortName(e.target.value)}
                  placeholder="Port name (e.g., LAN 1, WiFi)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <select
                  value={newPortType}
                  onChange={(e) => setNewPortType(e.target.value as ConnectionType)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="ethernet">Ethernet</option>
                  <option value="wifi">WiFi</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={addPort}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Connection Point */}
          {canConnectToParent && availableParents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connected To
              </label>
              <select
                value={formData.connectionPoint?.parentDeviceId || ''}
                onChange={(e) => {
                  const parentId = e.target.value;
                  if (parentId) {
                    setFormData({
                      ...formData,
                      connectionPoint: {
                        parentDeviceId: parentId,
                        portId: '',
                        connectionType: 'ethernet',
                      },
                    });
                  } else {
                    setFormData({
                      ...formData,
                      connectionPoint: undefined,
                    });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Not connected</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Port Selection */}
          {formData.connectionPoint?.parentDeviceId && availablePorts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Port
              </label>
              <select
                value={formData.connectionPoint.portId || ''}
                onChange={(e) => {
                  const port = availablePorts.find((p) => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    connectionPoint: {
                      ...formData.connectionPoint!,
                      portId: e.target.value,
                      connectionType: port?.type || 'ethernet',
                    },
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select port</option>
                {availablePorts.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name} ({port.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!ipError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Update' : 'Add'} Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
