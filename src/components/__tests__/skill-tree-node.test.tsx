/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillTreeNode } from "../skill-tree-node";
// import React from "react";

let mockState: any;
vi.mock("../../store", () => {
  return {
    default: (selector: any) => selector(mockState),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
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
});
