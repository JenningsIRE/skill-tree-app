import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Toast from "../toast";

describe("Toast component", () => {
  it("does not render when text is empty", () => {
    const { queryByRole } = render(<Toast text="" />);
    expect(queryByRole("alert")).toBeNull();
  });

  it("renders with provided text and visible classes", () => {
    render(<Toast text="Something went wrong" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");

    expect(alert.className).toContain("opacity-100");
    expect(alert.className).toContain("pointer-events-auto");

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    expect(screen.getByLabelText("Close error")).toBeInTheDocument();
  });

  it("hides (adds hidden classes) after clicking close but does not unmount while text prop remains", () => {
    render(<Toast text="Dismiss me" />);
    const alert = screen.getByRole("alert");
    const closeBtn = screen.getByLabelText("Close error");

    expect(alert.className).toContain("opacity-100");

    fireEvent.click(closeBtn);

    const updated = screen.getByRole("alert");
    expect(updated.className).toContain("opacity-0");
    expect(updated.className).toContain("pointer-events-none");
  });

  it("unmounts when text prop becomes empty", () => {
    const { rerender, queryByRole } = render(<Toast text="Temp error" />);
    expect(queryByRole("alert")).not.toBeNull();

    rerender(<Toast text="" />);
    expect(queryByRole("alert")).toBeNull();
  });

  it("mounts when text prop changes from empty to non-empty", () => {
    const { rerender } = render(<Toast text="" />);
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(<Toast text="Now visible" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.className).toContain("opacity-100");
    expect(screen.getByText("Now visible")).toBeInTheDocument();
  });
});
