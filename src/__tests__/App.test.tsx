/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Mocks and shared mutable state for the mocked store
let mockState: any = {};
vi.mock("../store", () => {
  return {
    __esModule: true,
    default: (selector: (s: any) => any) => selector(mockState),
  };
});

// Mock xyflow react primitives used by App
vi.mock("@xyflow/react", () => {
  return {
    __esModule: true,
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    // ReactFlow mock renders children and a button that triggers onNodesDelete with props.nodes
    ReactFlow: (props: any) => {
      return (
        <div data-testid="reactflow">
          <div data-testid="rf-props">
            {JSON.stringify({ nodes: props.nodes, edges: props.edges })}
          </div>
          <button
            data-testid="rf-trigger-delete"
            onClick={() => {
              if (typeof props.onNodesDelete === "function") {
                props.onNodesDelete(props.nodes ?? []);
              }
            }}
          >
            trigger-delete
          </button>
          {props.children}
        </div>
      );
    },
    Background: () => <div>bg</div>,
    // simple no-op graph helpers used by onNodesDelete
    getConnectedEdges: () => [],
    getIncomers: () => [],
    getOutgoers: () => [],
  };
});

// Mock Header and Toast components
vi.mock("../components/Header", () => {
  return {
    __esModule: true,
    Header: () => <div>header</div>,
  };
});
vi.mock("../components/toast", () => {
  return {
    __esModule: true,
    default: ({ text }: any) => <div>toast: {text}</div>,
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("App", () => {
  it("renders Header and ReactFlow with provided nodes/edges", async () => {
    mockState = {
      nodes: [{ id: "n1", data: {} }],
      edges: [{ id: "e1", source: "n1", target: "n1" }],
      errorText: "",
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      setEdges: vi.fn(),
      isValidConnection: vi.fn(() => true),
      incSkillPointsSpent: vi.fn(),
    };

    const { default: App } = await import("../App");
    render(<App />);

    expect(screen.getByText("header")).toBeTruthy();
    // ReactFlow mock renders JSON of nodes/edges
    expect(screen.getByTestId("rf-props").textContent).toContain("n1");
    expect(screen.getByText("bg")).toBeTruthy();
  });

  it("shows Toast when errorText is present", async () => {
    mockState = {
      nodes: [],
      edges: [],
      errorText: "something went wrong",
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      setEdges: vi.fn(),
      isValidConnection: vi.fn(() => true),
      incSkillPointsSpent: vi.fn(),
    };

    const { default: App } = await import("../App");
    render(<App />);

    expect(screen.getByText("toast: something went wrong")).toBeTruthy();
  });

  it("onNodesDelete calls incSkillPointsSpent with negative cost and calls setEdges", async () => {
    const setEdgesMock = vi.fn();
    const incMock = vi.fn();

    mockState = {
      nodes: [
        {
          id: "n-delete",
          data: { unlocked: true, cost: 5 },
        },
      ],
      edges: [{ id: "e1", source: "n-delete", target: "n-delete" }],
      errorText: "",
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      setEdges: setEdgesMock,
      isValidConnection: vi.fn(() => true),
      incSkillPointsSpent: incMock,
    };

    const { default: App } = await import("../App");
    render(<App />);

    // trigger the mocked ReactFlow's delete handler which will call App's onNodesDelete
    fireEvent.click(screen.getByTestId("rf-trigger-delete"));

    // incSkillPointsSpent should be called with -5 (negative of the node cost)
    expect(incMock).toHaveBeenCalledWith(-5);
    // setEdges should be called (we don't assert exact edge shape here)
    expect(setEdgesMock).toHaveBeenCalled();
  });
});
