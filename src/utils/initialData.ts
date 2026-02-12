import type { Device, NetworkConfig } from '../types/network';

// Start with an empty device list - users can add their own devices
export const initialDevices: Device[] = [];

export const getInitialConfig = (): NetworkConfig => ({
  devices: initialDevices,
  lastModified: new Date().toISOString(),
  version: '1.0.0',
});
