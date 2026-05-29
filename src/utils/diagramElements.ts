import type { Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { Device } from '../types/network';
import { DIAGRAM_NODE_HEIGHT, LEVEL_HEIGHT } from './diagramLayout';
import type { TreeEdgeData } from '../components/TreeEdge';

const JUNCTION_GAP = 28;

function getRowKey(y: number): number {
  return Math.round(y / LEVEL_HEIGHT);
}

function getWifiStyle(animated = true): Pick<Edge, 'style' | 'markerEnd' | 'animated'> {
  return {
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    animated,
  };
}

function getEthernetStyle(): Pick<Edge, 'style' | 'markerEnd' | 'animated'> {
  return {
    style: { stroke: '#374151', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' },
    animated: false,
  };
}

function computeJunctionY(parentBottom: number, childTop: number): number {
  const midpoint = parentBottom + (childTop - parentBottom) / 2;
  return Math.max(parentBottom + JUNCTION_GAP, midpoint);
}

export function buildDiagramEdges(
  devices: Device[],
  getDevice: (id: string) => Device | undefined
): Edge[] {
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

  const junctionByGroup = new Map<string, number>();

  for (const [parentId, childIds] of childrenByParent) {
    const parent = getDevice(parentId);
    if (!parent?.position) continue;

    const parentBottom = parent.position.y + DIAGRAM_NODE_HEIGHT;
    const rowGroups = new Map<number, string[]>();

    for (const childId of childIds) {
      const child = getDevice(childId);
      if (!child?.position || child.connectionPoint?.connectionType === 'wifi') continue;
      const rowKey = getRowKey(child.position.y);
      const group = rowGroups.get(rowKey) ?? [];
      group.push(childId);
      rowGroups.set(rowKey, group);
    }

    for (const [rowKey, groupChildIds] of rowGroups) {
      const childTops = groupChildIds
        .map((id) => getDevice(id)?.position?.y)
        .filter((y): y is number => y !== undefined);
      if (childTops.length === 0) continue;

      const childTop = Math.min(...childTops);
      junctionByGroup.set(`${parentId}-${rowKey}`, computeJunctionY(parentBottom, childTop));
    }
  }

  const edges: Edge[] = [];

  for (const device of devices) {
    const parentId = device.connectionPoint?.parentDeviceId;
    if (!parentId || !deviceIds.has(parentId) || !device.position) continue;

    const parent = getDevice(parentId);
    if (!parent?.position) continue;

    const rowKey = getRowKey(device.position.y);
    const junctionY = junctionByGroup.get(`${parentId}-${rowKey}`) ??
      computeJunctionY(parent.position.y + DIAGRAM_NODE_HEIGHT, device.position.y);

    const port = parent.networkDevice?.ports.find((p) => p.id === device.connectionPoint?.portId);
    const isWifi = device.connectionPoint?.connectionType === 'wifi';

    if (isWifi) {
      edges.push({
        id: `edge-${device.id}`,
        source: parentId,
        target: device.id,
        type: 'smoothstep',
        label: port?.name || '',
        labelStyle: { fontSize: 11, fill: '#374151' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 4,
        ...getWifiStyle(),
      });
    } else {
      edges.push({
        id: `edge-${device.id}`,
        source: parentId,
        target: device.id,
        type: 'tree',
        label: port?.name || '',
        data: { junctionY } satisfies TreeEdgeData,
        ...getEthernetStyle(),
      });
    }
  }

  return edges;
}
