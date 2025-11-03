/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillTreeNode } from "../skill-tree-node";

// Mocks for external modules used by the component under test
const getNodeConnectionsMock = vi.fn();
const deleteElementsMock = vi.fn();
vi.mock("@xyflow/react", () => {
  return {
    // Minimal mocked exports used in the component
    Handle: (props: any) => <div {...props} data-testid="handle" />,
    Position: { Top: "top", Bottom: "bottom" },
    useReactFlow: () => ({
      getNodeConnections: getNodeConnectionsMock,
      deleteElements: deleteElementsMock,
    }),
  };
});

// Mock zustand/shallow to just return the selector passed through
vi.mock("zustand/shallow", () => ({
  useShallow: (fn: any) => fn,
}));

// Simple base-node mock implementations to avoid rendering real UI library
vi.mock("@/components/base-node", () => {
  return {
    BaseNode: (props: any) => <div {...props} data-testid="base-node" />,
    BaseNodeContent: (props: any) => (
      <div {...props} data-testid="base-node-content" />
    ),
    BaseNodeFooter: (props: any) => (
      <div {...props} data-testid="base-node-footer" />
    ),
    BaseNodeHeader: (props: any) => (
      <div {...props} data-testid="base-node-header" />
    ),
    BaseNodeHeaderTitle: (props: any) => (
      <div {...props} data-testid="base-node-header-title" />
    ),
  };
});

// Mock dropdown menu primitives so onSelect/onClick handlers run as expected
vi.mock("./ui/dropdown-menu", () => {
  const DropdownMenu: any = ({ children }: any) => <div>{children}</div>;
  const DropdownMenuTrigger: any = ({ children, asChild }: any) =>
    asChild ? children : <div>{children}</div>;
  const DropdownMenuContent: any = ({ children }: any) => <div>{children}</div>;
  const DropdownMenuItem: any = ({ children, onSelect }: any) => {
    return (
      <button
        onClick={(e) => {
          if (onSelect) onSelect(e);
        }}
      >
        {children}
      </button>
    );
  };
  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  };
});

// Simple Button mock that passes props through to a button element
vi.mock("./ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

// Mock icons to simple spans
vi.mock("lucide-react", () => ({
  EllipsisVertical: (props: any) => <span {...props}>...</span>,
  Lock: (props: any) => <span {...props}>lock</span>,
  Unlock: (props: any) => <span {...props}>unlock</span>,
}));

// Mock EditNodeModal to render a small UI that calls onSubmit when its submit button clicked
// const editNodeModalOnSubmitCalls: any[] = [];
// vi.mock("./edit-node-modal", () => {
//   return {
//     EditNodeModal: (props: any) => {
//       const { onSubmit, title } = props;
//       return (
//         <div data-testid="edit-modal">
//           <div>{title}</div>
//           <button
//             onClick={() =>
//               onSubmit({
//                 label: "  New Title  ",
//                 cost: 5,
//                 description: "  new desc  ",
//               })
//             }
//           >
//             ModalSubmit
//           </button>
//         </div>
//       );
//     },
//   };
// });

// Mock the application's store. The mock returns selector(state) to mimic real zustand usage.
let state: any = {};
const editNodeMock = vi.fn();
vi.mock("../store", async () => {
  return {
    // default export is the hook
    default: (selector: any) => selector(state),
    // types are not needed, but exports referenced in the code can be left out
  };
});

// Import the component under test after mocks so imports pick up mocks

beforeEach(() => {
  vi.clearAllMocks();
  // default reasonable state - tests will override as needed
  state = {
    editNode: editNodeMock,
    skillPointsAvailable: 100,
    skillPointsSpent: 0,
    nodes: [],
  };
  getNodeConnectionsMock.mockImplementation(() => []);
  deleteElementsMock.mockImplementation(() => {});
});

describe("SkillTreeNode", () => {
  it("disables unlock button when upstream connections are locked", () => {
    // Node under test id '1' with cost 1
    const nodeId = "1";
    state.nodes = [
      { id: nodeId, data: { unlocked: false } },
      // upstream node '2' is locked (unlocked: false)
      { id: "2", data: { unlocked: false } },
    ];
    // getNodeConnections for target (upstream) should return connection from '2' -> '1'
    getNodeConnectionsMock.mockImplementation(({ type }: any) => {
      if (type === "target") return [{ source: "2", target: "1" }];
      return [];
    });

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
    state.nodes = [
      { id: nodeId, data: { unlocked: false } },
      // downstream node '3' is unlocked
      { id: "3", data: { unlocked: true } },
    ];
    // getNodeConnections for source (downstream) should return connection from '1' -> '3'
    getNodeConnectionsMock.mockImplementation(({ type }: any) => {
      if (type === "source") return [{ source: "1", target: "3" }];
      return [];
    });

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
    state.skillPointsAvailable = 1;
    state.skillPointsSpent = 1; // no free points left
    state.nodes = [{ id: nodeId, data: { unlocked: false } }];

    getNodeConnectionsMock.mockImplementation(() => []);

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
    state.skillPointsAvailable = 10;
    state.skillPointsSpent = 2;
    state.nodes = [{ id: nodeId, data: { unlocked: false } }];

    getNodeConnectionsMock.mockImplementation(() => []);

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
    state.nodes = [{ id: nodeId, data: { unlocked: false } }];
    getNodeConnectionsMock.mockImplementation(() => []);

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

    // DropdownMenuItem mock renders a button with text 'Delete'
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(deleteElementsMock).toHaveBeenCalledWith({
      nodes: [{ id: nodeId }],
    });
  });

  it("opens edit modal and submitting modal calls editNode with trimmed fields", () => {
    const nodeId = "1";
    state.nodes = [{ id: nodeId, data: { unlocked: false } }];
    getNodeConnectionsMock.mockImplementation(() => []);

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

    // Open edit modal via the Edit menu item (our mock triggers onSelect on click)
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    // Modal should render and have a ModalSubmit button (see our mock)
    const modalSubmit = screen.getByText("ModalSubmit");
    fireEvent.click(modalSubmit);

    // Expect editNode to be called with trimmed text and provided cost/description
    expect(editNodeMock).toHaveBeenCalledWith(nodeId, {
      label: "New Title",
      cost: 5,
      description: "new desc",
    });
  });
});
