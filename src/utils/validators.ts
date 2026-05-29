export {
  DEFAULT_NETWORK_RANGE,
  NETWORK_RANGES,
  NETWORK_RANGE_GROUPS,
  normalizeNetworkRange,
  getNetworkRange,
  isWideNetworkRange,
  formatIp,
  parseIPAddress,
  validateIPAddress,
  findIPConflicts,
  getNextAvailableIP,
  migrateIPToRange,
  getHostOctetFromIP,
  getThirdOctetFromIP,
  getRangePrefix,
  buildSlash24Address,
  buildSlash16Address,
  compareIpAddresses,
  migrateIPToRange as migrateIPToSubnet,
  buildSlash24Address as buildIPAddress,
} from './networkRanges';

import { DEFAULT_SUBNET } from '../types/network';
import { parseIPAddress } from './networkRanges';

/** @deprecated Use getRangePrefix with getNetworkRange */
export const getPrefixFromIP = (ip: string, fallback: string = DEFAULT_SUBNET): string => {
  const octets = parseIPAddress(ip);
  if (!octets) return fallback;
  return `${octets[0]}.${octets[1]}.${octets[2]}`;
};
