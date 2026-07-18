import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["playwright", "test"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: "https://equilibre-ia.netlify.app",
      PLAYWRIGHT_SKIP_WEBSERVER: "1",
    },
    shell: true,
  },
);

process.exit(result.status ?? 1);
