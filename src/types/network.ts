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
  subnet?: string;
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

export const DEFAULT_SUBNET = '192.168.178';

/** @deprecated Use DEFAULT_SUBNET or config.subnet instead */
export const IP_SUBNET = DEFAULT_SUBNET;

export interface PrivateSubnetOption {
  value: string;
  group: string;
}

const CLASS_A_SUBNETS = ['10.0.0', '10.0.1', '10.1.0', '10.1.1', '10.10.10'] as const;

const CLASS_B_SUBNETS = Array.from({ length: 16 }, (_, i) => `172.${16 + i}.0`);

const CLASS_C_SUBNETS = [
  '192.168.0',
  '192.168.1',
  '192.168.2',
  '192.168.10',
  '192.168.100',
  '192.168.178',
  '192.168.254',
] as const;

export const PRIVATE_SUBNETS: PrivateSubnetOption[] = [
  ...CLASS_A_SUBNETS.map((value) => ({ value, group: '10.0.0.0/8 (Class A)' })),
  ...CLASS_B_SUBNETS.map((value) => ({ value, group: '172.16.0.0/12 (Class B)' })),
  ...CLASS_C_SUBNETS.map((value) => ({ value, group: '192.168.0.0/16 (Class C)' })),
];

export const PRIVATE_SUBNET_GROUPS = [
  '10.0.0.0/8 (Class A)',
  '172.16.0.0/12 (Class B)',
  '192.168.0.0/16 (Class C)',
] as const;
