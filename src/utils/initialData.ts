import type { Device, NetworkConfig } from '../types/network';
import { DEFAULT_NETWORK_RANGE } from '../utils/networkRanges';

// Start with an empty device list - users can add their own devices
export const initialDevices: Device[] = [];

export const getInitialConfig = (): NetworkConfig => ({
  devices: initialDevices,
  subnet: DEFAULT_NETWORK_RANGE,
  lastModified: new Date().toISOString(),
  version: '1.0.0',
});
