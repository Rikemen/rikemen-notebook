declare module "node:fs" {
  export const existsSync: (path: string) => boolean;
  export const readFileSync: (path: string, encoding: string) => string;
}
