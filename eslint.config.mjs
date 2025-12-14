import nextPlugin from "eslint-config-next";

export default [
  ...nextPlugin,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {},
  },
];
