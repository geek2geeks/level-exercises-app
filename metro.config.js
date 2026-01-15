const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
    // Adds support for `.tflite` models
    'tflite',
    // Adds support for `.sql` migrations (Drizzle ORM)
    'sql'
);

module.exports = config;
