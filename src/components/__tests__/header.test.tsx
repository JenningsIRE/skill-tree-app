/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { Header } from "../header";

/**
 * Mocks
 *
 * The Header component (src/components/header.tsx) imports:
 * - useStore from "../store"
 * - { Button } from "./ui/button"
 * - { EditNodeModal } from "./edit-node-modal"
 *
 * The test file is located at src/components/__tests__/header.test.tsx, so the
 * resolved module paths from the test file are:
 * - ../../store
 * - ../ui/button
 * - ../edit-node-modal
 *
 * We mock those so the Header uses controllable, simple implementations.
 */

let mockState: any;

vi.mock("../../store", () => {
  // export default useStore(selector) -> call selector(mockState)
  return {
    default: (selector: any) =>
      typeof selector === "function" ? selector(mockState) : mockState,
  };
});

vi.mock("../ui/button", () => {
  // Simple Button passthrough to a native button to make testing clicks straightforward
  const Button: React.FC<any> = ({ children, ...props }) => (
    <button {...props}>{children}</button>
  );
  return { Button };
});

vi.mock("../edit-node-modal", () => {
  // Simple modal that exposes a submit button which calls props.onSubmit with sample data
  const EditNodeModal: React.FC<any> = (props: any) => (
    <div data-testid="edit-node-modal">
      <div>{props.title}</div>
      <button
        onClick={() =>
          props.onSubmit({
            label: "  New Node  ",
            cost: 3,
            description: " desc ",
          })
        }
      >
        Submit
      </button>
      <button onClick={props.closeModal}>Close</button>
    </div>
  );
  return { EditNodeModal };
});

// Import the component under test after mocks are registered

beforeEach(() => {
  vi.clearAllMocks();
  // default mock state
  mockState = {
    skillPointsAvailable: 5,
    skillPointsSpent: 0,
    incSkillPointsAvailable: vi.fn(),
    addNode: vi.fn(),
  };
});

afterEach(() => {
  // ensure clean between tests
  vi.clearAllMocks();
});

describe("Header", () => {
  it("renders computed skill points available", () => {
    mockState.skillPointsAvailable = 7;
    mockState.skillPointsSpent = 2;

    render(<Header />);

    expect(
      screen.getByText("Skill Points Available: 5", { exact: false })
    ).toBeInTheDocument();
  });

  it("calls incSkillPointsAvailable with +1 and -1 from + and - buttons (and disables - when not allowed)", () => {
    const inc = vi.fn();
    mockState.incSkillPointsAvailable = inc;

    // Case where decrement is enabled
    mockState.skillPointsAvailable = 3;
    mockState.skillPointsSpent = 1; // available - spent = 2 > 0

    const { rerender } = render(<Header />);

    const plusBtn = screen.getByText("+");
    const minusBtn = screen.getByText("-");

    fireEvent.click(plusBtn);
    expect(inc).toHaveBeenLastCalledWith(1);

    fireEvent.click(minusBtn);
    expect(inc).toHaveBeenLastCalledWith(-1);

    // Now make decrement disabled: available - spent <= 0
    inc.mockClear();
    mockState.skillPointsAvailable = 1;
    mockState.skillPointsSpent = 1; // available - spent = 0 -> disable

    rerender(<Header />);

    const disabledMinus = screen.getByText("-");
    expect(disabledMinus).toBeDisabled();

    // clicking disabled should not call handler
    fireEvent.click(disabledMinus);
    expect(inc).not.toHaveBeenCalled();
  });

  it("opens Add Node modal and submits trimmed values to store.addNode, then closes modal", () => {
    const addNode = vi.fn();
    mockState.addNode = addNode;

    render(<Header />);

    const addNodeBtn = screen.getByText("Add node");
    fireEvent.click(addNodeBtn);

    const modal = screen.getByTestId("edit-node-modal");
    expect(modal).toBeInTheDocument();

    const submit = screen.getByText("Submit");
    fireEvent.click(submit);

    // Header.handleAddSubmit trims label and description before calling addNode
    expect(addNode).toHaveBeenCalledTimes(1);
    expect(addNode).toHaveBeenCalledWith("New Node", 3, "desc");

    // After submit Header should close the modal
    expect(screen.queryByTestId("edit-node-modal")).toBeNull();
  });
});
