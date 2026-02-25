module.exports = {
  env: {
    es6: true,
    browser: true
  },
  extends: ["react-app"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2020,
    sourceType: "module"
  },
  rules: {
    "no-console": "off",
  },
};
