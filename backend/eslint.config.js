// ESLint v9 flat config（CommonJS，与后端代码风格一致）。
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        module: "writable",
        require: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-dupe-keys": "error",
      "no-empty": "error",
      "no-unreachable": "error"
    }
  }
];
