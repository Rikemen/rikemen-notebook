/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import checker from "vite-plugin-checker";

export default defineConfig({
  test: {
    // Vue コンポーネントのテスト時に DOM API を利用可能にする
    environment: "jsdom",
    globals: true,
  },
  define: {
    global: {},
  },
  plugins: [
    vue(),
    checker({
      typescript: true,
      overlay: false,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,ts,vue}"',
      },
      vueTsc: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
  },
});
