import type { MathNote } from "@/features/notes/types";

export const demoUserId = "user-1";

export const initialMathNotes: MathNote[] = [
  {
    createdAt: "2026-07-28T00:00:00.000Z",
    favorite: true,
    id: "calculus-note",
    ownerUid: demoUserId,
    recent: true,
    subject: "微積分",
    tags: ["極限", "導関数"],
    title: "微分の基礎",
    updatedAt: "2026-07-28T00:00:00.000Z",
  },
  {
    createdAt: "2026-07-27T00:00:00.000Z",
    favorite: false,
    id: "linear-algebra-note",
    ownerUid: demoUserId,
    recent: false,
    subject: "線形代数",
    tags: ["行列", "ベクトル"],
    title: "行列の計算",
    updatedAt: "2026-07-27T00:00:00.000Z",
  },
];

