import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import { useNetwork } from '../context/NetworkContext';
import { DEVICE_TYPE_COLORS } from '../types/network';
import { Network, HardDrive, Tv, Smartphone, Lightbulb, Car, Server, Wifi } from 'lucide-react';

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
      {/* Input handle (for connections coming into this node) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      
      <div className="flex items-center gap-2 mb-2">
        {data.icon}
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs font-mono opacity-75">{data.ip}</div>
      
      {/* Output handle (for connections going out from this node) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export const NetworkDiagram: React.FC = () => {
  const { devices, updateDevice, getDevice } = useNetwork();

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

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    devices.forEach((device) => {
      if (device.connectionPoint?.parentDeviceId) {
        const parent = getDevice(device.connectionPoint.parentDeviceId);
        const port = parent?.networkDevice?.ports.find(
          (p) => p.id === device.connectionPoint?.portId
        );

        edges.push({
          id: `edge-${device.id}`,
          source: device.connectionPoint.parentDeviceId,
          target: device.id,
          type: 'smoothstep',
          label: port?.name || '',
          animated: device.connectionPoint.connectionType === 'wifi',
          style: {
            stroke:
              device.connectionPoint.connectionType === 'wifi' ? '#3b82f6' : '#374151',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: device.connectionPoint.connectionType === 'wifi' ? '#3b82f6' : '#374151',
          },
        });
      }
    });
    return edges;
  }, [devices, getDevice]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when devices change
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

  return (
    <div className="w-full h-[600px] bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
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
      </ReactFlow>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        Devices: {nodes.length} | Connections: {edges.length}
      </div>
    </div>
  );
};
