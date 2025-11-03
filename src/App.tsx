import {
  Background,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  ReactFlow,
  ReactFlowProvider,
  type OnNodesDelete,
  useReactFlow,
} from "@xyflow/react";
import { useShallow } from "zustand/shallow";

import useStore, { type RFState } from "./store";
import { SkillTreeNode } from "./components/skill-tree-node";

import "@xyflow/react/dist/style.css";

import { useCallback, useMemo, useState } from "react";
import { Header } from "./components/header";
import Toast from "./components/toast";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  errorText: state.errorText,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setEdges: state.setEdges,
  isValidConnection: state.isValidConnection,
  incSkillPointsAvailable: state.incSkillPointsAvailable,
});

const nodeTypes = {
  skillTree: SkillTreeNode,
};

function Flow() {
  const {
    nodes,
    edges,
    errorText,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setEdges,
    isValidConnection,
    incSkillPointsAvailable,
  } = useStore(useShallow(selector));

  const { getNodeConnections } = useReactFlow();

  const onNodesDelete: OnNodesDelete = useCallback(
    (deleted) => {
      let remainingNodes = [...nodes];
      incSkillPointsAvailable(
        deleted.reduce((acc, node) => {
          if (node.data.unlocked && typeof node.data.cost === "number") {
            acc += node.data.cost;
          }
          return acc;
        }, 0)
      );
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, remainingNodes, acc);
          const outgoers = getOutgoers(node, remainingNodes, acc);
          const connectedEdges = getConnectedEdges([node], acc);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge)
          );

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              target,
            }))
          );

          remainingNodes = remainingNodes.filter((rn) => rn.id !== node.id);

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );
    },
    [nodes, incSkillPointsAvailable, setEdges, edges]
  );

  const [query, setQuery] = useState("");

  // compute matching node ids + reachable path nodes + highlighted edges
  const { displayNodes, displayEdges } = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return {
        displayNodes: nodes,
        displayEdges: edges,
      };
    }

    const matchingIds = new Set<string>();
    for (const node of nodes) {
      const label = String(node.data?.label ?? "").toLowerCase();
      if (label.includes(trimmedQuery)) {
        matchingIds.add(node.id);
      }
    }

    const collected = new Set<string>(matchingIds);
    const visitQueue = [...matchingIds];

    // traverse outward in each direction from found nodes
    while (visitQueue.length) {
      const currentId = visitQueue.shift()!;
      const connections = getNodeConnections({ nodeId: currentId });

      for (const edge of connections) {
        const neighborId =
          edge.source === currentId ? edge.target : edge.source;
        if (!collected.has(neighborId)) {
          collected.add(neighborId);
          visitQueue.push(neighborId);
        }
      }
    }

    const displayNodes = nodes.map((node) => {
      if (matchingIds.has(node.id)) {
        return {
          ...node,
          className: (node.className ?? "") + " ring-2 ring-blue-400",
        };
      }
      if (!collected.has(node.id)) {
        return {
          ...node,
          className: (node.className ?? "") + " opacity-30",
        };
      }
      return {
        ...node,
        className: (node.className ?? "") + " opacity-85",
      };
    });

    const displayEdges = edges.map((edge) => {
      const highlighted = collected.has(edge.source);
      return {
        ...edge,
        animated: highlighted,
      };
    });

    return { displayNodes, displayEdges };
  }, [query, nodes, edges, getNodeConnections]);

  return (
    <>
      <Header onSearch={setQuery} />
      {errorText && <Toast text={errorText} />}
      <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          colorMode="dark"
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
