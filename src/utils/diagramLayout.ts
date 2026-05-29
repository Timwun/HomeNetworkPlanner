import type { Device } from '../types/network';

const MIN_NODE_WIDTH = 200;
const NODE_HEIGHT = 88;
const H_GAP = 64;
const TREE_GAP = 120;
/** Max WiFi leaf devices per row before wrapping to the next branch level */
const MAX_WIFI_PER_ROW = 3;
/** Node height + edge label area + padding between rows */
export const LEVEL_HEIGHT = NODE_HEIGHT + 100;
export const DIAGRAM_NODE_HEIGHT = NODE_HEIGHT;

export function getNodeWidth(device: Device): number {
  return Math.max(MIN_NODE_WIDTH, device.name.length * 9 + 72);
}

function getNodeDepth(pos: { x: number; y: number }): number {
  return Math.round(pos.y / LEVEL_HEIGHT);
}

function getNodeCenterX(
  deviceId: string,
  deviceById: Map<string, Device>,
  positions: Map<string, { x: number; y: number }>
): number {
  const device = deviceById.get(deviceId);
  const pos = positions.get(deviceId);
  if (!device || !pos) return 0;
  return pos.x + getNodeWidth(device) / 2;
}

function partitionChildren(
  childIds: string[],
  deviceById: Map<string, Device>,
  childrenByParent: Map<string, string[]>
): { wired: string[]; wifiLeaves: string[] } {
  const wired: string[] = [];
  const wifiLeaves: string[] = [];

  for (const id of childIds) {
    const device = deviceById.get(id);
    if (!device) continue;

    const hasChildren = (childrenByParent.get(id) ?? []).length > 0;
    const isWifi = device.connectionPoint?.connectionType === 'wifi';

    if (isWifi && !hasChildren) {
      wifiLeaves.push(id);
    } else {
      wired.push(id);
    }
  }

  wifiLeaves.sort((a, b) =>
    (deviceById.get(a)?.name ?? '').localeCompare(deviceById.get(b)?.name ?? '')
  );

  return { wired, wifiLeaves };
}

function getWifiClusterWidth(leafIds: string[], deviceById: Map<string, Device>): number {
  const rows: string[][] = [];
  for (let i = 0; i < leafIds.length; i += MAX_WIFI_PER_ROW) {
    rows.push(leafIds.slice(i, i + MAX_WIFI_PER_ROW));
  }

  const rowWidths = rows.map((row) => {
    const widths = row.map((id) => getNodeWidth(deviceById.get(id)!));
    return widths.reduce((sum, w) => sum + w, 0) + H_GAP * Math.max(row.length - 1, 0);
  });

  return Math.max(...rowWidths, MIN_NODE_WIDTH);
}

function layoutWifiLeafCluster(
  leafIds: string[],
  startDepth: number,
  clusterCenterX: number,
  deviceById: Map<string, Device>,
  positions: Map<string, { x: number; y: number }>,
  visited: Set<string>
): number {
  const rows: string[][] = [];
  for (let i = 0; i < leafIds.length; i += MAX_WIFI_PER_ROW) {
    rows.push(leafIds.slice(i, i + MAX_WIFI_PER_ROW));
  }

  const rowWidths = rows.map((row) => {
    const widths = row.map((id) => getNodeWidth(deviceById.get(id)!));
    return widths.reduce((sum, w) => sum + w, 0) + H_GAP * Math.max(row.length - 1, 0);
  });
  const clusterWidth = Math.max(...rowWidths, MIN_NODE_WIDTH);
  const clusterLeft = clusterCenterX - clusterWidth / 2;

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rowWidth = rowWidths[rowIdx];
    const rowLeft = clusterLeft + (clusterWidth - rowWidth) / 2;
    let x = rowLeft;

    for (const id of row) {
      visited.add(id);
      const device = deviceById.get(id)!;
      const width = getNodeWidth(device);
      positions.set(id, { x, y: (startDepth + rowIdx) * LEVEL_HEIGHT });
      x += width + H_GAP;
    }
  }

  return clusterWidth;
}

function layoutLeafRow(
  leafIds: string[],
  depth: number,
  leftBound: number,
  deviceById: Map<string, Device>,
  positions: Map<string, { x: number; y: number }>,
  visited: Set<string>
): number {
  let x = leftBound;

  for (const id of leafIds) {
    visited.add(id);
    const device = deviceById.get(id)!;
    const width = getNodeWidth(device);
    positions.set(id, { x, y: depth * LEVEL_HEIGHT });
    x += width + H_GAP;
  }

  if (leafIds.length === 0) return 0;
  return x - leftBound - H_GAP;
}

function getMaxDepthInSubtrees(
  rootIds: string[],
  childrenByParent: Map<string, string[]>,
  positions: Map<string, { x: number; y: number }>
): number {
  let maxDepth = 0;

  function walk(id: string) {
    const pos = positions.get(id);
    if (pos) {
      maxDepth = Math.max(maxDepth, getNodeDepth(pos));
    }
    for (const childId of childrenByParent.get(id) ?? []) {
      walk(childId);
    }
  }

  for (const id of rootIds) {
    walk(id);
  }

  return maxDepth;
}

function layoutNode(
  deviceId: string,
  depth: number,
  leftBound: number,
  childrenByParent: Map<string, string[]>,
  deviceById: Map<string, Device>,
  positions: Map<string, { x: number; y: number }>,
  visited: Set<string>
): number {
  if (visited.has(deviceId)) {
    return 0;
  }
  visited.add(deviceId);

  const device = deviceById.get(deviceId);
  if (!device) {
    return 0;
  }

  const nodeWidth = getNodeWidth(device);
  const childIds = childrenByParent.get(deviceId) ?? [];

  if (childIds.length === 0) {
    positions.set(deviceId, { x: leftBound, y: depth * LEVEL_HEIGHT });
    return nodeWidth;
  }

  const { wired, wifiLeaves } = partitionChildren(childIds, deviceById, childrenByParent);
  const wrapWifi = wifiLeaves.length > MAX_WIFI_PER_ROW;

  if (wired.length === 0 && wrapWifi) {
    const clusterWidth = getWifiClusterWidth(wifiLeaves, deviceById);
    const parentCenterX = leftBound + clusterWidth / 2;
    positions.set(deviceId, {
      x: parentCenterX - nodeWidth / 2,
      y: depth * LEVEL_HEIGHT,
    });
    layoutWifiLeafCluster(
      wifiLeaves,
      depth + 1,
      parentCenterX,
      deviceById,
      positions,
      visited
    );
    return Math.max(clusterWidth, nodeWidth);
  }

  let x = leftBound;
  const rowChildCenters: number[] = [];

  for (const childId of wired) {
    const childWidth = layoutNode(
      childId,
      depth + 1,
      x,
      childrenByParent,
      deviceById,
      positions,
      visited
    );
    if (childWidth > 0) {
      rowChildCenters.push(getNodeCenterX(childId, deviceById, positions));
      x += childWidth + H_GAP;
    }
  }

  let wifiSpan = 0;
  if (wifiLeaves.length > 0 && !wrapWifi) {
    const wifiLeft = wired.length > 0 ? x : leftBound;
    wifiSpan = layoutLeafRow(wifiLeaves, depth + 1, wifiLeft, deviceById, positions, visited);
    for (const id of wifiLeaves) {
      rowChildCenters.push(getNodeCenterX(id, deviceById, positions));
    }
    if (wired.length > 0) {
      x += wifiSpan + H_GAP;
    } else {
      x = leftBound + wifiSpan;
    }
  }

  let parentCenterX: number;
  if (rowChildCenters.length === 0) {
    parentCenterX = leftBound + nodeWidth / 2;
  } else if (rowChildCenters.length === 1) {
    parentCenterX = rowChildCenters[0];
  } else {
    parentCenterX = (rowChildCenters[0] + rowChildCenters[rowChildCenters.length - 1]) / 2;
  }

  const parentLeft = parentCenterX - nodeWidth / 2;
  positions.set(deviceId, { x: parentLeft, y: depth * LEVEL_HEIGHT });

  if (wifiLeaves.length > 0 && wrapWifi) {
    const wifiStartDepth = getMaxDepthInSubtrees(wired, childrenByParent, positions) + 1;
    const clusterCenterX =
      wired.length > 0
        ? (rowChildCenters[0] + rowChildCenters[rowChildCenters.length - 1]) / 2
        : parentCenterX;

    wifiSpan = layoutWifiLeafCluster(
      wifiLeaves,
      wifiStartDepth,
      clusterCenterX,
      deviceById,
      positions,
      visited
    );
  }

  const rowContentWidth =
    wired.length > 0 || (wifiLeaves.length > 0 && !wrapWifi)
      ? x - leftBound - (wired.length > 0 || wifiLeaves.length > 0 ? H_GAP : 0)
      : 0;

  const contentWidth = Math.max(rowContentWidth, wifiSpan, nodeWidth);
  const subtreeLeft = Math.min(leftBound, parentLeft);
  const subtreeRight = Math.max(leftBound + contentWidth, parentLeft + nodeWidth);

  return subtreeRight - subtreeLeft;
}

function resolveHorizontalOverlaps(
  positions: Map<string, { x: number; y: number }>,
  devices: Device[],
  childrenByParent: Map<string, string[]>
): void {
  const byDepth = new Map<number, Device[]>();

  for (const device of devices) {
    const pos = positions.get(device.id);
    if (!pos) continue;
    const depth = getNodeDepth(pos);
    const group = byDepth.get(depth) ?? [];
    group.push(device);
    byDepth.set(depth, group);
  }

  for (const group of byDepth.values()) {
    group.sort((a, b) => positions.get(a.id)!.x - positions.get(b.id)!.x);

    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1];
      const curr = group[i];
      const prevPos = positions.get(prev.id)!;
      const currPos = positions.get(curr.id)!;
      const prevRight = prevPos.x + getNodeWidth(prev);
      const minX = prevRight + H_GAP;

      if (currPos.x < minX) {
        shiftSubtree(curr.id, minX - currPos.x, positions, childrenByParent);
      }
    }
  }
}

function shiftSubtree(
  rootId: string,
  dx: number,
  positions: Map<string, { x: number; y: number }>,
  childrenByParent: Map<string, string[]>
): void {
  const pos = positions.get(rootId);
  if (pos) {
    positions.set(rootId, { x: pos.x + dx, y: pos.y });
  }
  for (const childId of childrenByParent.get(rootId) ?? []) {
    shiftSubtree(childId, dx, positions, childrenByParent);
  }
}

export function computeHierarchicalLayout(
  devices: Device[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (devices.length === 0) {
    return positions;
  }

  const deviceById = new Map(devices.map((d) => [d.id, d]));
  const deviceIds = new Set(devices.map((d) => d.id));
  const childrenByParent = new Map<string, string[]>();

  for (const device of devices) {
    const parentId = device.connectionPoint?.parentDeviceId;
    if (parentId && deviceIds.has(parentId)) {
      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(device.id);
      childrenByParent.set(parentId, siblings);
    }
  }

  const roots = devices.filter(
    (d) =>
      !d.connectionPoint?.parentDeviceId || !deviceIds.has(d.connectionPoint.parentDeviceId)
  );

  const visited = new Set<string>();
  let xOffset = 0;

  for (const root of roots) {
    if (visited.has(root.id)) {
      continue;
    }
    const treeWidth = layoutNode(
      root.id,
      0,
      xOffset,
      childrenByParent,
      deviceById,
      positions,
      visited
    );
    xOffset += treeWidth + TREE_GAP;
  }

  for (const device of devices) {
    if (!positions.has(device.id)) {
      positions.set(device.id, { x: xOffset, y: 0 });
      xOffset += getNodeWidth(device) + H_GAP;
    }
  }

  resolveHorizontalOverlaps(positions, devices, childrenByParent);

  return positions;
}
