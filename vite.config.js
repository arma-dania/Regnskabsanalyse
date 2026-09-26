import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// To sider: værktøjet til de studerende og underviserens overblik. De bygges
// hver for sig, så underviserens kode ikke sendes med til de studerende.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: "index.html", underviser: "underviser.html" },
    },
  },
});
