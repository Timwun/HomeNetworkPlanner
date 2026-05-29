import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from 'reactflow';

export interface TreeEdgeData {
  junctionY: number;
}

export function TreeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  label,
  labelStyle,
  style,
  markerEnd,
  markerStart,
  interactionWidth,
}: EdgeProps<TreeEdgeData>) {
  const junctionY = data?.junctionY ?? (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${junctionY} L ${targetX} ${junctionY} L ${targetX} ${targetY}`;

  const hasHorizontal = Math.abs(targetX - sourceX) > 2;
  const labelX = hasHorizontal ? (sourceX + targetX) / 2 : sourceX;
  const labelY = hasHorizontal ? junctionY : (sourceY + junctionY) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none text-[11px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              ...(labelStyle as React.CSSProperties),
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
