import {
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeFooter,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "@/components/base-node";
import useStore, { type NodeData, type RFState } from "../store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { EllipsisVertical, Lock, Unlock } from "lucide-react";
import { useCallback, useState } from "react";
import { EditNodeModal } from "./edit-node-modal";
import { useShallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  editNode: state.editNode,
  skillPointsAvailable: state.skillPointsAvailable,
  skillPointsSpent: state.skillPointsSpent,
  nodes: state.nodes,
});

const areSomeConnectionsUnlocked = (
  connections: Array<{ source: string; target: string }>,
  nodes: Node[],
  type: "source" | "target",
  checkForLocked = false
) => {
  if (connections.length === 0) {
    return false;
  }
  return connections.some((connection) => {
    const node = nodes.find((n) => n.id === connection[type]);
    const value = node?.data.unlocked;
    return checkForLocked ? !value : !!value;
  });
};

export function SkillTreeNode({ id, data }: NodeProps<Node<NodeData>>) {
  const { getNodeConnections, deleteElements } = useReactFlow();

  const { editNode, skillPointsAvailable, skillPointsSpent, nodes } = useStore(
    useShallow(selector)
  );

  const areUpstreamConnectionsLocked = areSomeConnectionsUnlocked(
    getNodeConnections({ nodeId: id, type: "target" }),
    nodes,
    "source",
    true
  );
  const areDownstreamConnectionsUnlocked = areSomeConnectionsUnlocked(
    getNodeConnections({ nodeId: id, type: "source" }),
    nodes,
    "target"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleEditSubmit = (data: NodeData) => {
    const payload = {
      title: data.label.trim(),
      cost: data.cost,
      description: data.description?.trim(),
    };

    editNode(id, {
      label: payload.title,
      cost: payload.cost,
      description: payload.description,
    });
    closeModal();
  };

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  return (
    <BaseNode
      className={`${
        data.unlocked
          ? "shadow-[inset_0_0_10px_#00ff9f,0_0_15px_#00ff9f,0_0_30px_#00ff9f]"
          : ""
      }`}
    >
      <BaseNodeHeader className="border-b">
        <BaseNodeHeaderTitle>{data.label}</BaseNodeHeaderTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="nodrag p-1"
              aria-label="Node Actions"
              title="Node Actions"
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={openModal}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BaseNodeHeader>

      {data.description && (
        <BaseNodeContent>{data.description}</BaseNodeContent>
      )}

      <BaseNodeFooter className="bg-gray-600 items-end px-0 py-1 w-full rounded-bl-md rounded-br-md">
        <div className="flex items-center justify-between w-full px-2">
          <span>{`Cost: ${data.cost}`}</span>
          <Button
            onClick={() => {
              editNode(id, {
                unlocked: !data.unlocked,
              });
            }}
            disabled={
              areUpstreamConnectionsLocked ||
              areDownstreamConnectionsUnlocked ||
              (!data.unlocked &&
                skillPointsAvailable - skillPointsSpent - data.cost < 0)
            }
            aria-label="Unlock"
            variant="ghost"
            className="nodrag p-1"
          >
            {data.unlocked ? (
              <Unlock className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
          </Button>
        </div>
      </BaseNodeFooter>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      {isModalOpen && (
        <EditNodeModal
          title="Edit Node"
          closeModal={closeModal}
          onSubmit={handleEditSubmit}
          data={data}
        />
      )}
    </BaseNode>
  );
}
