/// <reference types="vitest" />
import {defineConfig} from "vite";

export default defineConfig({
  test: {
    env: {
      "NODE_ENV": "test",
    }
  }
});