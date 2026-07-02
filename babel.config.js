module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // Expo Router 在 SDK 50+ 建議使用 babel-preset-expo 內建的設定
    // 不再需要 expo-router/babel plugin（避免被提示 deprecated）
    plugins: [],
  };
};

