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
import { getLayoutedElements } from "./utils";

export type NodeData = {
  label: string;
  cost: number;
  description?: string;
  unlocked?: boolean;
};

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  skillPointsAvailable: number;
  errorText?: string;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (label: string, cost: number, description?: string) => void;
  setEdges: (newEdges: Edge[]) => void;
  editNode: (nodeId: string, data: Partial<NodeData>) => void;
  isValidConnection: IsValidConnection;
  incSkillPointsAvailable: (points: number) => void;
};

const useStore = create<RFState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      skillPointsAvailable: 0,
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
        let skillPointsAvailable = get().skillPointsAvailable;
        const nodes = get().nodes.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data as NodeData; // only have one type of node so this is safe
            if (typeof data.unlocked === "boolean") {
              skillPointsAvailable -= data.unlocked
                ? nodeData.cost
                : -nodeData.cost;
            } else if (nodeData.unlocked && data.cost) {
              skillPointsAvailable -= data.cost - nodeData.cost;
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
          skillPointsAvailable,
        });
      },
      incSkillPointsAvailable: (points: number) => {
        set({
          skillPointsAvailable: get().skillPointsAvailable + points,
        });
      },
      isValidConnection: (connection) => {
        const { nodes, edges } = get();
        const target = nodes.find((node) => node.id === connection.target);
        const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
          if (visited.has(node.id)) {
            return true;
          }

          visited.add(node.id);

          for (const outgoer of getOutgoers(node, nodes, edges)) {
            if (outgoer.id === connection.source) {
              return true;
            }
            if (hasCycle(outgoer, visited)) {
              return true;
            }
          }

          return false;
        };

        if (!target) {
          return false;
        }
        // cannot add pre-req to already unlocked node
        if (target.data.unlocked) {
          set({ errorText: "Cannot add prerequisites to an unlocked node." });
          return false;
        }

        if (target.id === connection.source || hasCycle(target)) {
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
      }),
    }
  )
);

export default useStore;
