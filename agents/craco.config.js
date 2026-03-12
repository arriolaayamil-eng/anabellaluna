module.exports = {
  eslint: {
    enable: true,
    mode: 'file',
  },
  webpack: {
    configure: (config) => {
      // Exclude Syncfusion packages from source-map-loader to avoid missing source map files
      const rules = config.module.rules || [];
      for (const rule of rules) {
        if (
          rule &&
          rule.enforce === 'pre' &&
          rule.use &&
          Array.isArray(rule.use) &&
          rule.use.some((u) => u.loader && u.loader.includes('source-map-loader'))
        ) {
          rule.exclude = Array.isArray(rule.exclude)
            ? [...rule.exclude, /@syncfusion/]
            : rule.exclude
            ? [rule.exclude, /@syncfusion/]
            : /@syncfusion/;
        }
      }

      // Reduce noise from source map parsing warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /Failed to parse source map/,
      ];

      return config;
    },
  },
};
