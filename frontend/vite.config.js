import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  resolve: {
    extensions: [".js", ".jsx"],
  },

  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
  },

  server: {
    proxy: {
      "/redact": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
