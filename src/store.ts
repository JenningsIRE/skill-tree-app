import {
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge,
  type IsValidConnection,
  getOutgoers,
} from "@xyflow/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid/non-secure";
import Dagre from "@dagrejs/dagre";

export type NodeData = {
  label: string;
  cost: number;
  description?: string;
  unlocked?: boolean;
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB" });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  skillPointsAvailable: number;
  skillPointsSpent: number;
  errorText?: string;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (label: string, cost: number, description?: string) => void;
  setEdges: (newEdges: Edge[]) => void;
  editNode: (nodeId: string, data: Partial<NodeData>) => void;
  isValidConnection: IsValidConnection;
  incSkillPointsAvailable: (points: number) => void;
  incSkillPointsSpent: (points: number) => void;
};

const useStore = create<RFState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      skillPointsAvailable: 0,
      skillPointsSpent: 0,
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection) => {
        const { nodes, edges } = get();
        const layouted = getLayoutedElements(nodes, addEdge(connection, edges));
        set({
          nodes: [...layouted.nodes],
          edges: [...layouted.edges],
        });
      },
      addNode: (label: string, cost: number, description?: string) => {
        const newNode = {
          id: nanoid(),
          type: "skillTree",
          data: { label, cost, description },
          position: { x: 0, y: 0 },
        };
        const { nodes, edges } = get();
        const layouted = getLayoutedElements([...nodes, newNode], edges);

        set({
          nodes: [...layouted.nodes],
          edges: [...layouted.edges],
        });
      },
      setEdges: (edges: Edge[]) => {
        set({
          edges,
        });
      },
      editNode: (nodeId: string, data: Partial<NodeData>) => {
        let skillPointsSpent = get().skillPointsSpent;
        const nodes = get().nodes.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data as NodeData;
            if (nodeData.unlocked !== data.unlocked) {
              skillPointsSpent += nodeData.unlocked
                ? -nodeData.cost
                : nodeData.cost;
            } else if (nodeData.unlocked && data.cost) {
              skillPointsSpent += data.cost - nodeData.cost;
            }
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }

          return node;
        });
        set({
          nodes,
          skillPointsSpent,
        });
      },
      incSkillPointsAvailable: (points: number) => {
        set({
          skillPointsAvailable: get().skillPointsAvailable + points,
        });
      },
      incSkillPointsSpent: (points: number) => {
        set({
          skillPointsSpent: get().skillPointsSpent + points,
        });
      },
      isValidConnection: (connection) => {
        const { nodes, edges } = get();
        const target = nodes.find((node) => node.id === connection.target);
        const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
          if (visited.has(node.id)) return false;

          visited.add(node.id);

          for (const outgoer of getOutgoers(node, nodes, edges)) {
            if (outgoer.id === connection.source) return true;
            if (hasCycle(outgoer, visited)) return true;
          }

          return false;
        };

        if (!target) return false;
        if (target.id === connection.source) return false;

        // cannot add pre-req to already unlocked node
        if (target.data.unlocked) {
          set({ errorText: "Cannot add prerequisites to an unlocked node." });
          return false;
        }

        if (hasCycle(target)) {
          set({ errorText: "Cannot create cyclic dependencies." });
          return false;
        }

        set({ errorText: undefined });

        return true;
      },
    }),
    {
      name: "skill-tree-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        skillPointsAvailable: state.skillPointsAvailable,
        skillPointsSpent: state.skillPointsSpent,
      }),
    }
  )
);

export default useStore;
