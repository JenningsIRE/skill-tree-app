import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { EditNodeModal } from "../edit-node-modal";

describe("EditNodeModal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.resetAllMocks();
    cleanup();
  });

  it("renders with provided data", () => {
    const data = { label: "Test Node", cost: 3, description: "A desc" };
    const onSubmit = vi.fn();
    const closeModal = vi.fn();

    render(
      <EditNodeModal
        title="Edit"
        closeModal={closeModal}
        onSubmit={onSubmit}
        data={data}
      />
    );

    const titleInput = screen.getByPlaceholderText(
      "Node title"
    ) as HTMLInputElement;
    const costInput = screen.getByPlaceholderText(
      "Node cost"
    ) as HTMLInputElement;
    const desc = screen.getByPlaceholderText(
      "Optional description"
    ) as HTMLTextAreaElement;

    expect(titleInput.value).toBe("Test Node");
    expect(costInput.value).toBe("3");
    expect(desc.value).toBe("A desc");
    expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
  });

  it("submits trimmed data and calls onSubmit", async () => {
    const onSubmit = vi.fn();
    const closeModal = vi.fn();
    const user = userEvent.setup();

    render(
      <EditNodeModal
        title="Create"
        closeModal={closeModal}
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByPlaceholderText(
      "Node title"
    ) as HTMLInputElement;
    const costInput = screen.getByPlaceholderText(
      "Node cost"
    ) as HTMLInputElement;
    const desc = screen.getByPlaceholderText(
      "Optional description"
    ) as HTMLTextAreaElement;
    const submitBtn = screen.getByRole("button", { name: /Create/i });

    await user.type(titleInput, "  My Node  ");
    await user.type(costInput, "4");
    await user.type(desc, "  some description  ");

    await user.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      label: "My Node",
      cost: 4,
      description: "some description",
    });
  });

  it("disables submit when title empty or cost is zero", async () => {
    const onSubmit = vi.fn();
    const closeModal = vi.fn();
    const user = userEvent.setup();

    render(
      <EditNodeModal
        title="Create"
        closeModal={closeModal}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByRole("button", {
      name: /Create/i,
    }) as HTMLButtonElement;
    expect(submitBtn).toBeDisabled();

    const titleInput = screen.getByPlaceholderText(
      "Node title"
    ) as HTMLInputElement;
    await user.type(titleInput, "Name");
    expect(submitBtn).toBeDisabled();

    const costInput = screen.getByPlaceholderText(
      "Node cost"
    ) as HTMLInputElement;
    await user.type(costInput, "2");
    expect(submitBtn).toBeEnabled();
  });

  it("calls closeModal on backdrop click and Escape, but not on inner dialog clicks", () => {
    const onSubmit = vi.fn();
    const closeModal = vi.fn();

    render(
      <EditNodeModal
        title="Modal"
        closeModal={closeModal}
        onSubmit={onSubmit}
      />
    );

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;
    if (!overlay) throw new Error("Overlay not found");

    fireEvent.mouseDown(dialog);
    expect(closeModal).not.toHaveBeenCalled();

    fireEvent.mouseDown(overlay);
    expect(closeModal).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(closeModal).toHaveBeenCalledTimes(2);
  });
});
