/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillTreeNode } from "../skill-tree-node";
import { useReactFlow } from "@xyflow/react";
// import React from "react";

let mockState: any;
vi.mock("../../store", () => {
  return {
    default: (selector: any) => selector(mockState),
  };
});

vi.mock("../ui/dropdown-menu", () => {
  const DropdownMenu = ({ children }: any) => <div>{children}</div>;

  const DropdownMenuTrigger = ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  );
  const DropdownMenuContent = ({ children }: any) => <div>{children}</div>;

  const DropdownMenuItem = ({ children, onSelect, onClick }: any) => (
    <button
      onClick={(e: any) => {
        if (typeof onSelect === "function") onSelect(e);
        if (typeof onClick === "function") onClick(e);
      }}
    >
      {children}
    </button>
  );
  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  };
});

const mockDeleteElements = vi.fn();
(useReactFlow as any).mockImplementation(() => ({
  getNodeConnections: vi.fn().mockReturnValue([]),
  deleteElements: mockDeleteElements,
  fitView: vi.fn(),
  getNode: vi.fn(),
}));

const editNodeMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    editNode: editNodeMock,
    skillPointsAvailable: 100,
    nodes: [] as any[],
    edges: [] as any[],
    // include any other setters your components call if needed:
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    addNode: vi.fn(),
    setEdges: vi.fn(),
    isValidConnection: vi.fn(),
    incSkillPointsAvailable: vi.fn(),
  };
});

describe("SkillTreeNode", () => {
  it("disables unlock button when upstream connections are locked", () => {
    const nodeId = "1";
    mockState.nodes = [
      { id: nodeId, data: { unlocked: false } },
      { id: "2", data: { unlocked: false } },
    ];
    mockState.edges = [{ id: "e1", source: "2", target: "1" }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{ label: "Test", cost: 1, unlocked: false }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const unlockButton = screen.getByLabelText("Unlock") as HTMLButtonElement;
    expect(unlockButton).toBeDisabled();
  });

  it("disables unlock button when downstream connections are unlocked", () => {
    const nodeId = "1";
    mockState.nodes = [
      { id: nodeId, data: { unlocked: false } },
      { id: "3", data: { unlocked: true } },
    ];
    mockState.edges = [{ id: "e1", source: "1", target: "3" }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{ label: "Test", cost: 1, unlocked: false }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const unlockButton = screen.getByLabelText("Unlock") as HTMLButtonElement;
    expect(unlockButton).toBeDisabled();
  });

  it("disables unlock button when not enough skill points are available", () => {
    const nodeId = "1";
    mockState.skillPointsAvailable = 0;
    mockState.nodes = [{ id: nodeId, data: { unlocked: false } }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{ label: "Expensive", cost: 5, unlocked: false }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const unlockButton = screen.getByLabelText("Unlock") as HTMLButtonElement;
    expect(unlockButton).toBeDisabled();
  });

  it("enables unlock button when all conditions satisfied", () => {
    const nodeId = "1";
    mockState.skillPointsAvailable = 8;
    mockState.nodes = [{ id: nodeId, data: { unlocked: false } }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{ label: "Affordable", cost: 5, unlocked: false }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const unlockButton = screen.getByLabelText("Unlock") as HTMLButtonElement;
    expect(unlockButton).toBeEnabled();
  });

  it("calls deleteElements when Delete menu item is clicked", () => {
    const nodeId = "1";
    mockState.nodes = [{ id: nodeId, data: { unlocked: false } }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{ label: "ToDelete", cost: 1 }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(mockDeleteElements).toHaveBeenCalledWith({
      nodes: [{ id: nodeId }],
    });
  });

  it("opens edit modal and submitting modal calls editNode with trimmed fields", () => {
    const nodeId = "1";
    mockState.nodes = [{ id: nodeId, data: { unlocked: false } }];

    render(
      <SkillTreeNode
        id={nodeId}
        data={{
          label: "Original",
          cost: 1,
          description: "orig",
        }}
        type="default"
        dragging={false}
        zIndex={1}
        selectable={true}
        selected={false}
        draggable={true}
        deletable={true}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );

    const dropdown = screen.getByLabelText("Node Actions");
    fireEvent.click(dropdown);

    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    const modalSubmit = screen.getByText("Create");
    fireEvent.click(modalSubmit);

    expect(editNodeMock).toHaveBeenCalledWith(nodeId, {
      label: "Original",
      cost: 1,
      description: "orig",
    });
  });
});
