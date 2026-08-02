const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o Metro resolva os arquivos .sql gerados pelo drizzle-kit.
config.resolver.sourceExts.push('sql');

module.exports = config;
