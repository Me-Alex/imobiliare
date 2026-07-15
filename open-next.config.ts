import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig(),
  // Keep local Windows verification and Cloudflare's Linux builder on the
  // same build command even though Bun remains the dependency lockfile.
  buildCommand: "npm run build",
};

export default config;
