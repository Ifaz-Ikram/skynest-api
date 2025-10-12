// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  // Always ignore build artifacts & seeds
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "seeds/**", // <— ignore seed scripts
    ],
  },

  // Base recommended rules
  js.configs.recommended,

  // Project-wide JS config (Node + Jest)
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: "latest",
      globals: {
        ...globals.node, // allow require/module/process/console
        ...globals.jest, // allow describe/it/expect
      },
    },
    rules: {
      eqeqeq: ["error", "smart"], // allow `== null`, strict otherwise
      "no-console": "off",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "warn",
    },
  },
];
