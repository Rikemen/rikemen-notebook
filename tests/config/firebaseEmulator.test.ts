import { describe, expect, it } from "vitest";
import firebaseSource from "@/utils/firebase.ts?raw";

describe("firebaseEmulator", () => {
  it("明示的な環境変数がある場合だけ各Emulatorへ接続する", () => {
    expect(firebaseSource).toContain('MODE !== "test"');
    expect(firebaseSource).toContain('VITE_USE_FIREBASE_EMULATORS === "true"');
    expect(firebaseSource).toContain("connectAuthEmulator");
    expect(firebaseSource).toContain("connectFirestoreEmulator");
    expect(firebaseSource).toContain("connectFunctionsEmulator");
    expect(firebaseSource).toContain("connectStorageEmulator");
    expect(firebaseSource).toContain('"127.0.0.1", 5001');
    expect(firebaseSource).toContain('"127.0.0.1", 9199');
  });
});
