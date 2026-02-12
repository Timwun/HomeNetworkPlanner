export type DeviceType = 
  | 'router'
  | 'switch'
  | 'access-point'
  | 'computer'
  | 'entertainment'
  | 'mobile'
  | 'iot'
  | 'vehicle'
  | 'other';

export type ConnectionType = 'ethernet' | 'wifi' | 'other';

export interface Port {
  id: string;
  name: string; // e.g., "LAN 1", "LAN 2", "WiFi 2.4GHz"
  type: ConnectionType;
}

export interface NetworkDevice {
  id: string;
  type: 'router' | 'switch' | 'access-point';
  ports: Port[];
}

export interface ConnectionPoint {
  parentDeviceId?: string; // ID of parent device (router/switch)
  portId?: string; // ID of the specific port on parent device
  connectionType: ConnectionType;
  customDescription?: string; // For additional notes like "via Switch Port 2"
}

export interface Device {
  id: string;
  name: string;
  ipAddress: string; // Will be enforced as 192.168.178.x
  type: DeviceType;
  connectionPoint?: ConnectionPoint;
  notes?: string;
  // Only populated for network devices (router/switch)
  networkDevice?: NetworkDevice;
  // For visual positioning in the diagram
  position?: { x: number; y: number };
}

export interface NetworkConfig {
  devices: Device[];
  lastModified: string;
  version: string; // For future compatibility
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  router: 'Router',
  switch: 'Switch',
  'access-point': 'Access Point',
  computer: 'Computer',
  entertainment: 'Entertainment',
  mobile: 'Mobile Device',
  iot: 'IoT / Smart Home',
  vehicle: 'Vehicle',
  other: 'Other',
};

export const DEVICE_TYPE_COLORS: Record<DeviceType, string> = {
  router: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  switch: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'access-point': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  computer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  mobile: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  iot: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  vehicle: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export const IP_SUBNET = '192.168.178';
