export const DEFAULT_P5_VERSION = "2.3.0";
export const DEFAULT_P5_CDN_URL = `https://cdn.jsdelivr.net/npm/p5@${DEFAULT_P5_VERSION}/lib/p5.js`;

export type P5ProjectLanguage = "html" | "css" | "javascript";

export interface P5ProjectFile {
  content: string;
  isEntry: boolean;
  language: P5ProjectLanguage;
  path: string;
}

export interface P5Project {
  entryPath: string;
  files: P5ProjectFile[];
}

export type AddP5FileResult =
  | { ok: true; project: P5Project }
  | { error: string; ok: false; project: P5Project };

const DEFAULT_INDEX_HTML = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gauss Notebook Sketch</title>
    <script src="${DEFAULT_P5_CDN_URL}"></script>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <script src="sketch.js"></script>
  </body>
</html>`;

const DEFAULT_STYLE_CSS = `html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #ffffff;
}

canvas {
  display: block;
}`;

const DEFAULT_SKETCH_JS = `function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  stroke(18, 103, 232);
  strokeWeight(3);
  noFill();
  beginShape();
  for (let x = -2; x <= 2; x += 0.04) {
    const px = map(x, -2, 2, 24, width - 24);
    const py = map(x * x, 0, 4, height - 24, 24);
    vertex(px, py);
  }
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}`;

export const createDefaultP5Project = (): P5Project => ({
  entryPath: "index.html",
  files: [
    {
      content: DEFAULT_INDEX_HTML,
      isEntry: true,
      language: "html",
      path: "index.html",
    },
    {
      content: DEFAULT_STYLE_CSS,
      isEntry: false,
      language: "css",
      path: "style.css",
    },
    {
      content: DEFAULT_SKETCH_JS,
      isEntry: false,
      language: "javascript",
      path: "sketch.js",
    },
  ],
});

export const findEntryFile = (project: P5Project) =>
  project.files.find((file) => file.path === project.entryPath);

export const updateProjectFile = (
  project: P5Project,
  path: string,
  content: string,
): P5Project => ({
  ...project,
  files: project.files.map((file) => {
    if (file.path === path) {
      return {
        ...file,
        content,
      };
    }
    return file;
  }),
});

export const validateP5FileName = (fileName: string, project: P5Project) => {
  const normalized = fileName.trim();
  if (!normalized.endsWith(".js")) {
    return "JavaScriptファイル名は.jsで終えてください。";
  }
  if (!/^[A-Za-z0-9_-]+\.js$/u.test(normalized)) {
    return "ファイル名に使用できない文字が含まれています。";
  }
  if (project.files.some((file) => file.path.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    return "同じ名前のファイルが既にあります。";
  }
  return "";
};

export const addProjectJavaScriptFile = (
  project: P5Project,
  fileName: string,
): AddP5FileResult => {
  const normalized = fileName.trim();
  const error = validateP5FileName(normalized, project);
  if (error) {
    return {
      error,
      ok: false,
      project,
    };
  }
  return {
    ok: true,
    project: {
      ...project,
      files: [
        ...project.files,
        {
          content: "",
          isEntry: false,
          language: "javascript",
          path: normalized,
        },
      ],
    },
  };
};
