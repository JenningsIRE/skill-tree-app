import { useEffect, useState } from "react";
import type { NodeData } from "../store";
import { createPortal } from "react-dom";

type ModalProps = {
  title: string;
  closeModal: () => void;
  onSubmit: (data: NodeData) => void;
  data?: NodeData;
};

export function EditNodeModal({
  title,
  closeModal,
  onSubmit,
  data,
}: ModalProps) {
  const [nodeTitle, setNodeTitle] = useState(data?.label || "");
  const [nodeDescription, setNodeDescription] = useState(
    data?.description || ""
  );
  const [nodeCost, setNodeCost] = useState<number>(data?.cost || 0);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onMouseDown={closeModal}
    >
      <div
        className="bg-white p-4 rounded-lg w-[480px] max-w-[95%] shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">{title}</div>
          <button
            aria-label="Close"
            onClick={closeModal}
            className="px-2 py-1 rounded-md border border-black/8 bg-transparent text-lg"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const title = nodeTitle?.trim();
            if (!title || !nodeCost) return;
            onSubmit({
              label: title,
              cost: nodeCost,
              description: nodeDescription?.trim() || undefined,
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="block">
              <div className="text-xs mb-1">Title</div>
              <input
                className="w-full px-3 py-2 rounded-md border border-black/12 text-sm outline-none"
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
                placeholder="Node title"
                autoFocus
              />
            </label>

            <label className="block">
              <div className="text-xs mb-1">Cost</div>
              <input
                className="w-full px-3 py-2 rounded-md border border-black/12 text-sm outline-none"
                type="number"
                value={nodeCost}
                onChange={(e) => setNodeCost(Number(e.target.value))}
                placeholder="Node cost"
                autoFocus
              />
            </label>

            <label className="block">
              <div className="text-xs mb-1">Description</div>
              <textarea
                className="w-full px-3 py-2 rounded-md border border-black/12 text-sm outline-none min-h-[100px] resize-vertical"
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                placeholder="Optional description"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-2 rounded-md border border-black/8 bg-transparent hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!nodeTitle.trim() || !nodeCost}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-blue-600/50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
