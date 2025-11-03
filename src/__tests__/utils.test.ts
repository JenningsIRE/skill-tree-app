/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { getLayoutedElements } from "../utils";

vi.mock("@dagrejs/dagre", () => {
  class Graph {
    _nodes = new Map<string, any>();
    setDefaultEdgeLabel() {
      return this;
    }
    setGraph() {
      return this;
    }
    setEdge() {
      return this;
    }
    setNode(id: string, obj: any) {
      this._nodes.set(id, obj);
      return this;
    }
    node(id: string) {
      return this._nodes.get(id);
    }
  }

  return {
    __esModule: true,
    default: {
      graphlib: { Graph },
      // layout will assign deterministic x/y based on insertion order and node sizes
      layout: (g: any) => {
        let i = 0;
        g._nodes.forEach((n: any, id: string) => {
          const width = n.width ?? 0;
          const height = n.height ?? 0;
          g._nodes.set(id, {
            ...n,
            x: i * 200 + width / 2,
            y: i * 100 + height / 2,
          });
          i++;
        });
      },
    },
  };
});

describe("getLayoutedElements", () => {
  it("positions nodes accounting for measured width/height and returns edges unchanged", () => {
    const nodes = [
      { id: "a", measured: { width: 100, height: 50 } },
      { id: "b", measured: { width: 80, height: 40 } },
      { id: "c", measured: { width: 60, height: 30 } },
    ];
    const edges = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ];

    const result = getLayoutedElements(nodes as any, edges as any);

    // Our mock layout sets internal node.x = index*200 + width/2
    // getLayoutedElements subtracts width/2 so expected x == index*200
    expect(result.nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(result.nodes[1].position).toEqual({ x: 200, y: 100 });
    expect(result.nodes[2].position).toEqual({ x: 400, y: 200 });

    expect(result.edges).toBe(edges);
  });
});
