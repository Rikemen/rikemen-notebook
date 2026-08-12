import { describe, expect, it } from "vitest";
import callableSource from "../../functions/src/wrappers/notes/deleteNotebook.ts?raw";
import cleanupSource from "../../functions/src/wrappers/notes/cleanupDeletingNotebooks.ts?raw";
import indexSource from "../../functions/src/index.ts?raw";

describe("notebook deletion wrappers", () => {
  it("Callableを長時間削除向け設定で公開する", () => {
    expect(callableSource).toContain('region: "asia-northeast1"');
    expect(callableSource).toContain("timeoutSeconds: 540");
    expect(indexSource).toContain(
      'exportIfNeeded("deleteNotebook", "notes/deleteNotebook", exports)',
    );
  });

  it("削除中ノートを定期再試行するFunctionを公開する", () => {
    expect(cleanupSource).toContain('schedule: "every 60 minutes"');
    expect(cleanupSource).toContain("retryCount: 3");
    expect(indexSource).toContain(
      'exportIfNeeded("cleanupDeletingNotebooks", "notes/cleanupDeletingNotebooks", exports)',
    );
  });
});
