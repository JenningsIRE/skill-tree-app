import {
  Background,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  ReactFlow,
  ReactFlowProvider,
  type OnNodesDelete,
} from "@xyflow/react";
import { useShallow } from "zustand/shallow";

import useStore, { type RFState } from "./store";
import { SkillTreeNode } from "./components/skill-tree-node";

import "@xyflow/react/dist/style.css";

import { useCallback } from "react";
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
  incSkillPointsSpent: state.incSkillPointsSpent,
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
    incSkillPointsSpent,
  } = useStore(useShallow(selector));

  // don't know if this is better or worse ux
  // const { fitView } = useReactFlow();

  // useEffect(() => {
  //   fitView();
  // }, [nodes.length, edges.length, fitView]);

  const onNodesDelete: OnNodesDelete = useCallback(
    (deleted) => {
      let remainingNodes = [...nodes];
      incSkillPointsSpent(
        -deleted.reduce((acc, node) => {
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
    [nodes, incSkillPointsSpent, setEdges, edges]
  );

  return (
    <>
      <Header />
      {errorText && <Toast text={errorText} />}
      <div className="fixed top-16 left-0 right-0 bottom-0 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
