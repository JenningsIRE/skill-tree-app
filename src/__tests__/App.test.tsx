/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReactFlow } from "@xyflow/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import App from "../App";

let mockState: any = {};
vi.mock("../store", () => {
  return {
    default: (selector: any) => selector(mockState),
  };
});

(ReactFlow as any).mockImplementation((props: any) => {
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
});

vi.mock("../components/Header", () => {
  return {
    __esModule: true,
    Header: ({ onSearch }: any) => (
      <div>
        <div>header</div>
        <input
          data-testid="mock-header-input"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
    ),
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
      incSkillPointsAvailable: vi.fn(),
    };

    render(<App />);

    expect(screen.getByText("header")).toBeTruthy();
    // ReactFlow mock renders JSON of nodes/edges
    expect(screen.getByTestId("rf-props").textContent).toContain("n1");
    expect(screen.getByTestId("mock-background")).toBeTruthy();
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
      incSkillPointsAvailable: vi.fn(),
    };

    render(<App />);

    expect(screen.getByText("toast: something went wrong")).toBeTruthy();
  });

  it("onNodesDelete calls incSkillPointsAvailable with negative cost and calls setEdges", async () => {
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
      incSkillPointsAvailable: incMock,
    };

    render(<App />);

    fireEvent.click(screen.getByTestId("rf-trigger-delete"));

    expect(incMock).toHaveBeenCalledWith(5);
    expect(setEdgesMock).toHaveBeenCalled();
  });

  it("search query highlights matching nodes and animates reachable edges", async () => {
    mockState = {
      nodes: [
        { id: "n1", data: { label: "Alpha" }, className: "" },
        { id: "n2", data: { label: "Beta" }, className: "" },
      ],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
      errorText: "",
      onNodesChange: vi.fn(),
      onEdgesChange: vi.fn(),
      onConnect: vi.fn(),
      setEdges: vi.fn(),
      isValidConnection: vi.fn(() => true),
      incSkillPointsAvailable: vi.fn(),
    };

    render(<App />);

    let propsText = screen.getByTestId("rf-props").textContent ?? "";
    expect(propsText).equal(
      '{"nodes":[{"id":"n1","data":{"label":"Alpha"},"className":""},{"id":"n2","data":{"label":"Beta"},"className":""}],"edges":[{"id":"e1","source":"n1","target":"n2"}]}'
    );

    const input = screen.getByTestId("mock-header-input");

    fireEvent.change(input, { target: { value: "Alpha" } });

    propsText = screen.getByTestId("rf-props").textContent ?? "";
    expect(propsText).equal(
      '{"nodes":[{"id":"n1","data":{"label":"Alpha"},"className":" ring-2 ring-blue-400"},{"id":"n2","data":{"label":"Beta"},"className":" opacity-30"}],"edges":[{"id":"e1","source":"n1","target":"n2","animated":true}]}'
    );
  });
});
