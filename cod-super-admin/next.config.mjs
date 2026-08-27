import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  // Share local miniflare state with cod-server/cod-client by pointing at the
  // same persist path. Mirrors `wrangler --persist-to ../.wrangler-shared`.
  await initOpenNextCloudflareForDev({
    persist: { path: "../.wrangler-shared/v3" },
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
