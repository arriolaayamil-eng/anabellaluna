module.exports = {
  eslint: {
    enable: false,
  },
  webpack: {
    configure: (config) => {
      // CRA 5 uses ESLintWebpackPlugin instead of eslint-loader.
      // craco's eslint.enable:false only targets eslint-loader, so we
      // must also strip the plugin to truly disable ESLint during builds.
      config.plugins = (config.plugins || []).filter(
        (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin',
      );

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
