import { DEFAULT_SUBNET } from '../types/network';

const escapeRegex = (value: string): string => value.replace(/\./g, '\\.');

const getSubnetPattern = (subnet: string): RegExp =>
  new RegExp(`^${escapeRegex(subnet)}\\.(\\d+)$`);

export const parseIPAddress = (ip: string): number[] | null => {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => parseInt(part, 10));
  if (octets.some((octet) => isNaN(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
};

export const isPrivateIP = (octets: number[]): boolean => {
  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

export const validateIPAddress = (ip: string): { valid: boolean; error?: string } => {
  const octets = parseIPAddress(ip);
  if (!octets) {
    return { valid: false, error: 'Enter a valid IP address (e.g., 192.168.1.10)' };
  }

  const host = octets[3];
  if (host < 1 || host > 254) {
    return { valid: false, error: 'Last octet must be between 1 and 254' };
  }

  if (!isPrivateIP(octets)) {
    return {
      valid: false,
      error: 'Must be a private address (10.x.x.x, 172.16.x.x–172.31.x.x, or 192.168.x.x)',
    };
  }

  return { valid: true };
};

export const validateHostOctet = (host: string): { valid: boolean; error?: string } => {
  if (!/^\d+$/.test(host)) {
    return { valid: false, error: 'Host must be a number between 1 and 254' };
  }

  const value = parseInt(host, 10);
  if (value < 1 || value > 254) {
    return { valid: false, error: 'Host must be between 1 and 254' };
  }

  return { valid: true };
};

export const getPrefixFromIP = (ip: string, fallback: string = DEFAULT_SUBNET): string => {
  const octets = parseIPAddress(ip);
  if (!octets) return fallback;
  return `${octets[0]}.${octets[1]}.${octets[2]}`;
};

export const getHostOctetFromIP = (ip: string): string => {
  const octets = parseIPAddress(ip);
  return octets ? String(octets[3]) : '1';
};

export const buildIPAddress = (prefix: string, host: string): string => `${prefix}.${host}`;

export const findIPConflicts = (
  devices: Array<{ id: string; ipAddress: string }>,
  currentDeviceId?: string,
): Map<string, string[]> => {
  const conflicts = new Map<string, string[]>();
  const ipToDevices = new Map<string, string[]>();

  devices.forEach((device) => {
    const existingDevices = ipToDevices.get(device.ipAddress) || [];
    existingDevices.push(device.id);
    ipToDevices.set(device.ipAddress, existingDevices);
  });

  ipToDevices.forEach((deviceIds, ip) => {
    if (deviceIds.length > 1) {
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

export const getNextAvailableIP = (
  usedIPs: string[],
  subnet: string = DEFAULT_SUBNET,
): string => {
  const pattern = getSubnetPattern(subnet);
  const usedLastOctets = usedIPs
    .map((ip) => {
      const match = ip.match(pattern);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  if (usedLastOctets.length === 0) {
    return `${subnet}.1`;
  }

  const highestOctet = Math.max(...usedLastOctets);
  const nextOctet = highestOctet + 1;

  if (nextOctet <= 254) {
    return `${subnet}.${nextOctet}`;
  }

  const usedSet = new Set(usedLastOctets);
  for (let i = 1; i <= 254; i++) {
    if (!usedSet.has(i)) {
      return `${subnet}.${i}`;
    }
  }

  return `${subnet}.1`;
};

export const migrateIPToSubnet = (ip: string, subnet: string): string => {
  const host = getHostOctetFromIP(ip);
  return buildIPAddress(subnet, host);
};
