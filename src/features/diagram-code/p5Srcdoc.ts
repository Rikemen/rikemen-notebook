/* eslint-disable max-lines-per-function, max-statements, sonarjs/cognitive-complexity */
import { findEntryFile, type P5Project, type P5ProjectFile } from "@/features/diagram-code/p5Project";
import { detectP5Version, isAllowedP5CdnUrl } from "@/features/diagram-code/p5Version";

export type P5SrcdocResult =
  | { ok: true; srcdoc: string; version: string }
  | { error: string; ok: false };

const isRemoteReference = (value: string) => /^https?:\/\//u.test(value);
const escapedScriptContent = (content: string) => content.replace(/<\/script/giu, "<\\/script");
const fileByPath = (project: P5Project, path: string) =>
  project.files.find((file) => file.path === path);

const createRuntimeBootstrap = (runId: string) => `
(() => {
  const send = (type, message = "") => {
    parent.postMessage({ source: "gauss-p5-runtime", runId: ${JSON.stringify(runId)}, type, message }, "*");
  };
  window.addEventListener("error", (event) => send("error", event.message || "実行エラー"), true);
  window.addEventListener("unhandledrejection", (event) => send("error", String(event.reason || "Promiseエラー")));
  window.addEventListener("load", () => send("ready"));
})();`;

const inlineStyleSheet = (
  documentNode: Document,
  link: HTMLLinkElement,
  file: P5ProjectFile,
) => {
  const style = documentNode.createElement("style");
  style.textContent = file.content;
  link.replaceWith(style);
};

const inlineScript = (
  documentNode: Document,
  script: HTMLScriptElement,
  file: P5ProjectFile,
) => {
  const inline = documentNode.createElement("script");
  inline.textContent = escapedScriptContent(file.content);
  script.replaceWith(inline);
};

export const buildP5Srcdoc = (project: P5Project, runId: string): P5SrcdocResult => {
  const entryFile = findEntryFile(project);
  if (!entryFile || entryFile.language !== "html") {
    return {
      error: "entry file index.html が見つかりません。",
      ok: false,
    };
  }

  const documentNode = new DOMParser().parseFromString(entryFile.content, "text/html");
  const links = [...documentNode.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')];
  for (const link of links) {
    const path = link.getAttribute("href") ?? "";
    if (isRemoteReference(path)) {
      return {
        error: `外部スタイルは許可されていません: ${path}`,
        ok: false,
      };
    }
    const file = fileByPath(project, path);
    if (!file || file.language !== "css") {
      return {
        error: `CSSファイルが見つかりません: ${path}`,
        ok: false,
      };
    }
    inlineStyleSheet(documentNode, link, file);
  }

  const scripts = [...documentNode.querySelectorAll<HTMLScriptElement>("script[src]")];
  for (const script of scripts) {
    const path = script.getAttribute("src") ?? "";
    if (isRemoteReference(path)) {
      if (!isAllowedP5CdnUrl(path)) {
        return {
          error: `許可されていない外部scriptです: ${path}`,
          ok: false,
        };
      }
    } else {
      const file = fileByPath(project, path);
      if (!file || file.language !== "javascript") {
        return {
          error: `JavaScriptファイルが見つかりません: ${path}`,
          ok: false,
        };
      }
      inlineScript(documentNode, script, file);
    }
  }

  const csp = documentNode.createElement("meta");
  csp.httpEquiv = "Content-Security-Policy";
  csp.content =
    "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'";
  documentNode.head.prepend(csp);

  const bootstrap = documentNode.createElement("script");
  bootstrap.textContent = createRuntimeBootstrap(runId);
  documentNode.head.prepend(bootstrap);

  return {
    ok: true,
    srcdoc: `<!doctype html>\n${documentNode.documentElement.outerHTML}`,
    version: detectP5Version(entryFile.content),
  };
};
