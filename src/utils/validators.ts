import { IP_SUBNET } from "../types/network";

export const validateIPAddress = (
  ip: string,
): { valid: boolean; error?: string } => {
  // Check if IP matches the required subnet
  const ipRegex = /^192\.168\.178\.(\d+)$/;
  const match = ip.match(ipRegex);

  if (!match) {
    return {
      valid: false,
      error: `IP address must be in the ${IP_SUBNET}.x format (e.g., ${IP_SUBNET}.1)`,
    };
  }

  const lastOctet = parseInt(match[1], 10);

  if (lastOctet < 1 || lastOctet > 254) {
    return {
      valid: false,
      error: "Last octet must be between 1 and 254",
    };
  }

  return { valid: true };
};

export const findIPConflicts = (
  devices: Array<{ id: string; ipAddress: string }>,
  currentDeviceId?: string,
): Map<string, string[]> => {
  const conflicts = new Map<string, string[]>();
  const ipToDevices = new Map<string, string[]>();

  // Group devices by IP address
  devices.forEach((device) => {
    const existingDevices = ipToDevices.get(device.ipAddress) || [];
    existingDevices.push(device.id);
    ipToDevices.set(device.ipAddress, existingDevices);
  });

  // Find conflicts (IPs with multiple devices)
  ipToDevices.forEach((deviceIds, ip) => {
    if (deviceIds.length > 1) {
      // If we're editing a device, only flag as conflict if other devices have the same IP
      if (currentDeviceId) {
        const otherDevices = deviceIds.filter((id) => id !== currentDeviceId);
        if (otherDevices.length > 0) {
          conflicts.set(ip, deviceIds);
        }
      } else {
        conflicts.set(ip, deviceIds);
      }
    }
  });

  return conflicts;
};

export const getNextAvailableIP = (usedIPs: string[]): string => {
  const usedLastOctets = usedIPs
    .map((ip) => {
      const match = ip.match(/^192\.168\.178\.(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  // If no IPs are in use, start with .1
  if (usedLastOctets.length === 0) {
    return `${IP_SUBNET}.1`;
  }

  // Find the highest used IP and add 1
  const highestOctet = Math.max(...usedLastOctets);
  const nextOctet = highestOctet + 1;

  // Make sure we don't exceed the valid range
  if (nextOctet <= 254) {
    return `${IP_SUBNET}.${nextOctet}`;
  }

  // If highest + 1 would exceed 254, fall back to first available
  const usedSet = new Set(usedLastOctets);
  for (let i = 1; i <= 254; i++) {
    if (!usedSet.has(i)) {
      return `${IP_SUBNET}.${i}`;
    }
  }

  return `${IP_SUBNET}.1`; // Fallback
};
