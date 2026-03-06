import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["src/__tests__/accessibility.test.tsx", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/public-chat-tools.ts",
        "src/lib/chat-tools.ts",
        "src/lib/pdf-utils.ts",
        "src/lib/search.ts",
        "src/lib/crypto.ts",
        "src/lib/tokens.ts",
        "src/lib/validation.ts",
        "src/lib/mailer.ts",
        "src/app/api/chat/route.ts",
        "src/app/api/admin/chat/route.ts",
        "src/app/api/admin/images/route.ts",
        "src/app/api/forms/events/route.ts",
        "src/app/api/search/route.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
