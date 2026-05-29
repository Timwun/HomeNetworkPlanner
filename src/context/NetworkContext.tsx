import React, { createContext, useContext, type ReactNode } from 'react';
import type { Device, NetworkConfig } from '../types/network';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getInitialConfig } from '../utils/initialData';
import { findIPConflicts, migrateIPToSubnet } from '../utils/validators';
import { DEFAULT_SUBNET } from '../types/network';

interface NetworkContextType {
  config: NetworkConfig;
  devices: Device[];
  subnet: string;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  updateDevicePositions: (positions: Record<string, { x: number; y: number }>) => void;
  deleteDevice: (id: string) => void;
  getDevice: (id: string) => Device | undefined;
  getIPConflicts: () => Map<string, string[]>;
  hasIPConflict: (ip: string, deviceId?: string) => boolean;
  setSubnet: (subnet: string) => void;
  exportConfig: () => string;
  importConfig: (jsonString: string) => void;
  resetToDefault: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useLocalStorage<NetworkConfig>(
    'network-planner-config',
    getInitialConfig()
  );

  const addDevice = (device: Device) => {
    const newConfig: NetworkConfig = {
      ...config,
      devices: [...config.devices, device],
      lastModified: new Date().toISOString(),
    };
    setConfig(newConfig);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    const newConfig: NetworkConfig = {
      ...config,
      devices: config.devices.map((device) =>
        device.id === id ? { ...device, ...updates } : device
      ),
      lastModified: new Date().toISOString(),
    };
    setConfig(newConfig);
  };

  const updateDevicePositions = (positions: Record<string, { x: number; y: number }>) => {
    const newConfig: NetworkConfig = {
      ...config,
      devices: config.devices.map((device) => {
        const position = positions[device.id];
        return position ? { ...device, position } : device;
      }),
      lastModified: new Date().toISOString(),
    };
    setConfig(newConfig);
  };

  const deleteDevice = (id: string) => {
    const newConfig: NetworkConfig = {
      ...config,
      devices: config.devices.filter((device) => device.id !== id),
      lastModified: new Date().toISOString(),
    };
    setConfig(newConfig);
  };

  const getDevice = (id: string): Device | undefined => {
    return config.devices.find((device) => device.id === id);
  };

  const getIPConflicts = () => {
    return findIPConflicts(config.devices);
  };

  const hasIPConflict = (ip: string, deviceId?: string): boolean => {
    const conflicts = findIPConflicts(config.devices, deviceId);
    return conflicts.has(ip);
  };

  const exportConfig = (): string => {
    return JSON.stringify(config, null, 2);
  };

  const importConfig = (jsonString: string) => {
    try {
      const importedConfig = JSON.parse(jsonString) as NetworkConfig;
      // Basic validation
      if (!importedConfig.devices || !Array.isArray(importedConfig.devices)) {
        throw new Error('Invalid config format');
      }
      setConfig({
        ...importedConfig,
        subnet: importedConfig.subnet ?? DEFAULT_SUBNET,
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error('Failed to import configuration: ' + (error as Error).message);
    }
  };

  const resetToDefault = () => {
    setConfig(getInitialConfig());
  };

  const subnet = config.subnet ?? DEFAULT_SUBNET;

  const setSubnet = (newSubnet: string) => {
    if (newSubnet === subnet) return;

    setConfig({
      ...config,
      subnet: newSubnet,
      devices: config.devices.map((device) => ({
        ...device,
        ipAddress: migrateIPToSubnet(device.ipAddress, newSubnet),
      })),
      lastModified: new Date().toISOString(),
    });
  };

  const value: NetworkContextType = {
    config,
    devices: config.devices,
    subnet,
    addDevice,
    updateDevice,
    updateDevicePositions,
    deleteDevice,
    getDevice,
    getIPConflicts,
    hasIPConflict,
    setSubnet,
    exportConfig,
    importConfig,
    resetToDefault,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
