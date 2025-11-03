/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// Expose globals tests can set if they need to override behavior
// globalThis.__getNodeConnectionsMock = ...
// globalThis.__deleteElementsMock = ...

vi.mock("@xyflow/react", () => {
  const ReactLocal = React;

  const ReactFlowProvider: React.FC<{ children?: React.ReactNode }> = ({
    children,
  }) => ReactLocal.createElement(ReactLocal.Fragment, null, children);

  const Handle: React.FC<any> = () =>
    ReactLocal.createElement("div", { "data-testid": "mock-handle" }, null);
  const Controls: React.FC = () => ReactLocal.createElement("div", null);
  const Background: React.FC = () =>
    ReactLocal.createElement("div", { "data-testid": "mock-background" });

  const Position = {
    Top: "top",
    Bottom: "bottom",
    Left: "left",
    Right: "right",
  };

  const getIncomers = (node: any, nodes: any[], edges: any[]) =>
    edges
      .filter((e) => e.target === node.id)
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter(Boolean);

  const getOutgoers = (node: any, nodes: any[], edges: any[]) =>
    edges
      .filter((e) => e.source === node.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean);

  const useReactFlow = () => ({
    getNodeConnections: vi.fn().mockReturnValue([]),
    deleteElements: vi.fn(),
    fitView: vi.fn(),
    getNode: vi.fn(),
  });

  const ReactFlow: React.FC<any> = vi.fn((props) =>
    ReactLocal.createElement(
      "div",
      { "data-testid": "mock-reactflow" },
      props.children
    )
  );

  return {
    ReactFlowProvider,
    ReactFlow,
    Handle,
    Controls,
    Background,
    Position,
    useReactFlow,
    getIncomers,
    getOutgoers,
    getConnectedEdges: () => [],
  };
});
