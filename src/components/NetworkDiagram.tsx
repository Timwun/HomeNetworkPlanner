import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  type Node,
  Controls,
  Background,
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  Handle,
  Position,
} from 'reactflow';
import { useNetwork } from '../context/NetworkContext';
import { DEVICE_TYPE_COLORS } from '../types/network';
import { computeHierarchicalLayout } from '../utils/diagramLayout';
import { buildDiagramEdges } from '../utils/diagramElements';
import { TreeEdge } from './TreeEdge';
import {
  Network,
  HardDrive,
  Tv,
  Smartphone,
  Lightbulb,
  Car,
  Server,
  Wifi,
  AlignVerticalSpaceAround,
} from 'lucide-react';

const getIconForType = (type: string) => {
  switch (type) {
    case 'router':
      return <Network className="w-6 h-6" />;
    case 'switch':
      return <Server className="w-6 h-6" />;
    case 'access-point':
      return <Wifi className="w-6 h-6" />;
    case 'computer':
      return <HardDrive className="w-6 h-6" />;
    case 'entertainment':
      return <Tv className="w-6 h-6" />;
    case 'mobile':
      return <Smartphone className="w-6 h-6" />;
    case 'iot':
      return <Lightbulb className="w-6 h-6" />;
    case 'vehicle':
      return <Car className="w-6 h-6" />;
    default:
      return <HardDrive className="w-6 h-6" />;
  }
};

interface CustomNodeData {
  label: string;
  ip: string;
  type: string;
  icon: React.ReactNode;
  colorClass: string;
}

const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[180px] ${data.colorClass} border-gray-400 dark:border-gray-600`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

      <div className="flex items-center gap-2 mb-2">
        {data.icon}
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs font-mono opacity-75">{data.ip}</div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  tree: TreeEdge,
};

const NetworkDiagramInner: React.FC = () => {
  const { devices, updateDevice, updateDevicePositions, getDevice } = useNetwork();
  const { fitView } = useReactFlow();

  const initialNodes: Node[] = useMemo(
    () =>
      devices.map((device) => ({
        id: device.id,
        type: 'custom',
        position: device.position || { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          label: device.name,
          ip: device.ipAddress,
          type: device.type,
          icon: getIconForType(device.type),
          colorClass: DEVICE_TYPE_COLORS[device.type],
        },
      })),
    [devices]
  );

  const initialEdges = useMemo(
    () => buildDiagramEdges(devices, getDevice),
    [devices, getDevice]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateDevice(node.id, { position: node.position });
    },
    [updateDevice]
  );

  const handleAutoLayout = useCallback(() => {
    const layout = computeHierarchicalLayout(devices);
    const positions: Record<string, { x: number; y: number }> = {};
    layout.forEach((pos, id) => {
      positions[id] = pos;
    });
    updateDevicePositions(positions);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ padding: 0.2 });
      });
    });
  }, [devices, updateDevicePositions, fitView]);

  return (
    <div className="w-full h-[600px] bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'tree',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <Panel position="top-left">
          <button
            onClick={handleAutoLayout}
            disabled={devices.length === 0}
            className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Arrange devices by network topology"
          >
            <AlignVerticalSpaceAround className="w-4 h-4" />
            Auto Layout
          </button>
        </Panel>
      </ReactFlow>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        Devices: {devices.length} | Connections: {edges.length}
      </div>
    </div>
  );
};

export const NetworkDiagram: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NetworkDiagramInner />
    </ReactFlowProvider>
  );
};
