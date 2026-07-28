// MEDICARE_CPANEL_LOW_RESOURCE
import originalConfig from "./next.config.base.mjs";

function applyLimits(config = {}) {
  return {
    ...config,

    eslint: {
      ...(config.eslint || {}),
      ignoreDuringBuilds: true,
    },

    experimental: {
      ...(config.experimental || {}),
      cpus: 1,
      workerThreads: false,
      staticGenerationMaxConcurrency: 1,
      staticGenerationMinPagesPerWorker: 1000,
    },
  };
}

export default async function medicareConfig(...args) {
  const resolved =
    typeof originalConfig === "function"
      ? await originalConfig(...args)
      : originalConfig;

  return applyLimits(resolved || {});
}
