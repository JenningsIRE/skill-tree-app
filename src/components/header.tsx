import { useState } from "react";
import type { NodeData, RFState } from "../store";
import useStore from "../store";
import { Button } from "./ui/button";
import { EditNodeModal } from "./edit-node-modal";
import { useShallow } from "zustand/react/shallow";

const selector = (state: RFState) => ({
  skillPointsAvailable: state.skillPointsAvailable,
  skillPointsSpent: state.skillPointsSpent,
  incSkillPointsAvailable: state.incSkillPointsAvailable,
  onAddNode: state.addNode,
});

export function Header() {
  const {
    skillPointsAvailable,
    skillPointsSpent,
    incSkillPointsAvailable,
    onAddNode,
  } = useStore(useShallow(selector));
  const [query, setQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const onSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch(query);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSubmit = (data: NodeData) => {
    const payload = {
      title: data.label.trim(),
      cost: data.cost,
      description: data.description?.trim(),
    };

    onAddNode(payload.title, payload.cost, payload.description);
    closeAddModal();
  };

  const isDecDisabled =
    skillPointsAvailable <= 0 || skillPointsAvailable - skillPointsSpent <= 0;

  return (
    <header className="flex items-center gap-4 p-3 px-4  bg-gray-600 sticky top-0 z-30 text-white">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="text-sm font-semibold">Skill Tree App</div>
        </div>
      </div>

      <div className="w-px h-8 bg-black mx-3" />

      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="text-sm ">{`Skill Points Available: ${
            skillPointsAvailable - skillPointsSpent
          }`}</div>
        </div>
      </div>

      <Button
        disabled={isDecDisabled}
        onClick={() => incSkillPointsAvailable(-1)}
      >
        -
      </Button>
      <Button onClick={() => incSkillPointsAvailable(1)}>+</Button>

      <div className="w-px h-8 bg-black mx-3" />

      <nav aria-label="Canvas controls" className="flex items-center gap-2">
        <Button onClick={openAddModal} aria-label="Add node" title="Add node">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm">Add node</span>
        </Button>
      </nav>

      <div className="flex-1" />

      <form onSubmit={handleSearchSubmit} className="flex">
        <input
          aria-label="Search nodes"
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-2 py-2 rounded-md border border-black/12 outline-none w-56 text-sm"
        />
        <Button type="submit" aria-label="Search" title="Search">
          Search
        </Button>
      </form>

      {isAddModalOpen && (
        <EditNodeModal
          title="Add Node"
          closeModal={closeAddModal}
          onSubmit={handleAddSubmit}
        />
      )}
    </header>
  );
}
