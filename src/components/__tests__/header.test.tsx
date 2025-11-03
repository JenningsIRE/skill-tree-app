/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { Header } from "../header";

let mockState: any;
vi.mock("../../store", () => {
  return {
    default: (selector: any) => selector(mockState),
  };
});

vi.mock("../ui/button", () => {
  const Button: React.FC<any> = ({ children, ...props }) => (
    <button {...props}>{children}</button>
  );
  return { Button };
});

vi.mock("../edit-node-modal", () => {
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

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    skillPointsAvailable: 5,
    incSkillPointsAvailable: vi.fn(),
    addNode: vi.fn(),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Header", () => {
  it("renders computed skill points available", () => {
    mockState.skillPointsAvailable = 5;

    render(<Header onSearch={vi.fn()} />);

    expect(
      screen.getByText("Skill Points Available: 5", { exact: false })
    ).toBeInTheDocument();
  });

  it("calls incSkillPointsAvailable with +1 and -1 from + and - buttons (and disables - when not allowed)", () => {
    const inc = vi.fn();
    mockState.incSkillPointsAvailable = inc;

    // Case where decrement is enabled
    mockState.skillPointsAvailable = 2;

    const { rerender } = render(<Header onSearch={vi.fn()} />);

    const plusBtn = screen.getByText("+");
    const minusBtn = screen.getByText("-");

    fireEvent.click(plusBtn);
    expect(inc).toHaveBeenLastCalledWith(1);

    fireEvent.click(minusBtn);
    expect(inc).toHaveBeenLastCalledWith(-1);

    // Now make decrement disabled: available - spent <= 0
    inc.mockClear();
    mockState.skillPointsAvailable = 0;

    rerender(<Header onSearch={vi.fn()} />);

    const disabledMinus = screen.getByText("-");
    expect(disabledMinus).toBeDisabled();

    // clicking disabled should not call handler
    fireEvent.click(disabledMinus);
    expect(inc).not.toHaveBeenCalled();
  });

  it("opens Add Node modal and submits trimmed values to store.addNode, then closes modal", () => {
    const addNode = vi.fn();
    mockState.addNode = addNode;

    render(<Header onSearch={vi.fn()} />);

    const addNodeBtn = screen.getByText("Add node");
    fireEvent.click(addNodeBtn);

    const modal = screen.getByTestId("edit-node-modal");
    expect(modal).toBeInTheDocument();

    const submit = screen.getByText("Submit");
    fireEvent.click(submit);

    expect(addNode).toHaveBeenCalledTimes(1);
    expect(addNode).toHaveBeenCalledWith("New Node", 3, "desc");
    expect(screen.queryByTestId("edit-node-modal")).toBeNull();
  });

  it("calls onSearch with current query when Search button is clicked", () => {
    const onSearch = vi.fn();
    render(<Header onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(
      "Search nodes..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });

    const searchBtn = screen.getByText("Search");
    fireEvent.click(searchBtn);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("submits the form and calls onSearch when Enter is pressed (form submit)", () => {
    const onSearch = vi.fn();
    render(<Header onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(
      "Search nodes..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });

    const form = input.closest("form") as HTMLFormElement;
    expect(form).toBeTruthy();

    fireEvent.submit(form);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("test");
  });
});
