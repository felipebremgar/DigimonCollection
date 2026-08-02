module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite `import` de arquivos .sql (migrations do Drizzle) como string.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
