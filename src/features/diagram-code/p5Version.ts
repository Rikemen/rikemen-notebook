const P5_CDN_PATTERN =
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/p5@(?<version>[^/]+)\/lib\/p5(?:\.min)?\.js$/u;

export const isAllowedP5CdnUrl = (value: string) => P5_CDN_PATTERN.test(value);

export const detectP5Version = (indexHtml: string) => {
  const documentNode = new DOMParser().parseFromString(indexHtml, "text/html");
  const scripts = [...documentNode.querySelectorAll<HTMLScriptElement>("script[src]")];
  for (const script of scripts) {
    const source = script.getAttribute("src") ?? "";
    const match = P5_CDN_PATTERN.exec(source);
    if (match?.groups?.version) {
      return match.groups.version;
    }
  }
  return "";
};
