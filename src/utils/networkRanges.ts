import { DEFAULT_SUBNET } from '../types/network';

export interface NetworkRangeDefinition {
  id: string;
  label: string;
  group: string;
  minIp: [number, number, number, number];
  maxIp: [number, number, number, number];
}

export const DEFAULT_NETWORK_RANGE = `${DEFAULT_SUBNET}/24`;

export const NETWORK_RANGES: NetworkRangeDefinition[] = [
  {
    id: '10.0.0.0/16',
    label: '10.0.0.0/16 (10.0.0.1 – 10.0.255.255)',
    group: '10.0.0.0/8 (Class A)',
    minIp: [10, 0, 0, 1],
    maxIp: [10, 0, 255, 255],
  },
  ...['10.0.0', '10.0.1', '10.1.0', '10.1.1', '10.10.10'].map((prefix) => ({
    id: `${prefix}/24`,
    label: `${prefix}.x`,
    group: '10.0.0.0/8 (Class A)',
    minIp: [parseInt(prefix.split('.')[0], 10), parseInt(prefix.split('.')[1], 10), parseInt(prefix.split('.')[2], 10), 1] as [number, number, number, number],
    maxIp: [parseInt(prefix.split('.')[0], 10), parseInt(prefix.split('.')[1], 10), parseInt(prefix.split('.')[2], 10), 254] as [number, number, number, number],
  })),
  ...Array.from({ length: 16 }, (_, i) => {
    const prefix = `172.${16 + i}.0`;
    return {
      id: `${prefix}/24`,
      label: `${prefix}.x`,
      group: '172.16.0.0/12 (Class B)',
      minIp: [172, 16 + i, 0, 1] as [number, number, number, number],
      maxIp: [172, 16 + i, 0, 254] as [number, number, number, number],
    };
  }),
  ...['192.168.0', '192.168.1', '192.168.2', '192.168.10', '192.168.100', '192.168.178', '192.168.254'].map(
    (prefix) => {
      const [a, b, c] = prefix.split('.').map((part) => parseInt(part, 10));
      return {
        id: `${prefix}/24`,
        label: `${prefix}.x`,
        group: '192.168.0.0/16 (Class C)',
        minIp: [a, b, c, 1] as [number, number, number, number],
        maxIp: [a, b, c, 254] as [number, number, number, number],
      };
    },
  ),
];

export const NETWORK_RANGE_GROUPS = [
  '10.0.0.0/8 (Class A)',
  '172.16.0.0/12 (Class B)',
  '192.168.0.0/16 (Class C)',
] as const;

export function normalizeNetworkRange(value: string | undefined): string {
  if (!value) return DEFAULT_NETWORK_RANGE;
  if (value.includes('/')) return value;
  return `${value}/24`;
}

export function getNetworkRange(rangeId: string | undefined): NetworkRangeDefinition {
  const normalized = normalizeNetworkRange(rangeId);
  return (
    NETWORK_RANGES.find((range) => range.id === normalized) ??
    NETWORK_RANGES.find((range) => range.id === DEFAULT_NETWORK_RANGE)!
  );
}

export function isWideNetworkRange(rangeId: string | undefined): boolean {
  return getNetworkRange(rangeId).id === '10.0.0.0/16';
}

export function formatIp(octets: [number, number, number, number] | number[]): string {
  return octets.join('.');
}

export function ipToNumber(octets: number[]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function numberToIp(value: number): [number, number, number, number] {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ];
}

export function isIpInRange(octets: number[], range: NetworkRangeDefinition): boolean {
  const value = ipToNumber(octets);
  return value >= ipToNumber(range.minIp) && value <= ipToNumber(range.maxIp);
}

export function getRangePrefix(range: NetworkRangeDefinition): string {
  if (range.id === '10.0.0.0/16') return '10.0';
  return range.id.replace('/24', '');
}

export function getHostOctetFromIP(ip: string): string {
  const octets = parseIPAddress(ip);
  return octets ? String(octets[3]) : '1';
}

export function getThirdOctetFromIP(ip: string): string {
  const octets = parseIPAddress(ip);
  return octets ? String(octets[2]) : '0';
}

export function parseIPAddress(ip: string): number[] | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => parseInt(part, 10));
  if (octets.some((octet) => isNaN(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

export const validateIPAddress = (
  ip: string,
  rangeId: string = DEFAULT_NETWORK_RANGE,
): { valid: boolean; error?: string } => {
  const octets = parseIPAddress(ip);
  if (!octets) {
    return { valid: false, error: 'Enter a valid IP address (e.g., 10.0.0.1)' };
  }

  const range = getNetworkRange(rangeId);
  if (!isIpInRange(octets, range)) {
    return {
      valid: false,
      error: `IP must be between ${formatIp(range.minIp)} and ${formatIp(range.maxIp)}`,
    };
  }

  return { valid: true };
};

export function compareIpAddresses(a: string, b: string): number {
  const aOctets = parseIPAddress(a);
  const bOctets = parseIPAddress(b);

  if (!aOctets && !bOctets) return 0;
  if (!aOctets) return 1;
  if (!bOctets) return -1;

  return ipToNumber(aOctets) - ipToNumber(bOctets);
}

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
  rangeId: string = DEFAULT_NETWORK_RANGE,
): string => {
  const range = getNetworkRange(rangeId);
  const usedSet = new Set(
    usedIPs.filter((ip) => {
      const octets = parseIPAddress(ip);
      return octets ? isIpInRange(octets, range) : false;
    }),
  );

  const min = ipToNumber(range.minIp);
  const max = ipToNumber(range.maxIp);

  for (let value = min; value <= max; value++) {
    const ip = formatIp(numberToIp(value));
    if (!usedSet.has(ip)) return ip;
  }

  return formatIp(range.minIp);
};

export const migrateIPToRange = (ip: string, rangeId: string): string => {
  const octets = parseIPAddress(ip);
  const range = getNetworkRange(rangeId);
  if (!octets) return formatIp(range.minIp);

  if (range.id === '10.0.0.0/16') {
    return formatIp([10, 0, octets[2], octets[3]]);
  }

  const prefix = getRangePrefix(range);
  return `${prefix}.${octets[3]}`;
};

export const buildSlash24Address = (prefix: string, host: string): string => `${prefix}.${host}`;

export const buildSlash16Address = (third: string, fourth: string): string =>
  `10.0.${third}.${fourth}`;
