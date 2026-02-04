import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: "public",
  resolve: {
    alias: {
      "@app/": `${path.resolve(__dirname, "src")}/`,
    },
  },
});
