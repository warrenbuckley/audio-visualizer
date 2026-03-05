import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import catppuccin from "@catppuccin/starlight";

export default defineConfig({
  site: "https://warrenbuckley.github.io",
  base: "/audio-visualizer",
  // Bind to all interfaces so GitHub Codespaces port forwarding works.
  server: { host: true },
  integrations: [
    starlight({
      title: "<audio-visualizer>",
      description:
        "A Lit WebComponent that visualises real-time microphone frequency bands as animated bars. Zero runtime dependencies beyond Lit.",
      plugins: [
        catppuccin({
          dark: { flavor: "mocha", accent: "lavender" },
          light: { flavor: "latte", accent: "lavender" },
        }),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/warrenbuckley/audio-visualizer",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://linked.in/me/warrenbuckley",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
          ],
        },
        {
          label: "Usage",
          items: [
            { label: "Plain HTML", slug: "usage/html" },
            { label: "TypeScript / JavaScript", slug: "usage/typescript" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Device Switching", slug: "guides/device-switching" },
          ],
        },
        {
          label: "Concepts",
          items: [{ label: "Architecture", slug: "concepts/architecture" }],
        },
        {
          label: "Reference",
          items: [
            { label: "API Reference", slug: "reference/api" },
            { label: "Styling", slug: "reference/styling" },
          ],
        },
        { label: "Playground", slug: "playground" },
      ],
      customCss: ["./src/styles/custom.css"],
      lastUpdated: true,
    }),
  ],
});
