import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      react: pluginReact,
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      // Prettier integration
      "prettier/prettier": [
        "error",
        {
          semi: true,
          singleQuote: true,
          trailingComma: "all",
          tabWidth: 2,
          printWidth: 100,
          endOfLine: "auto",
        },
      ],
    },
  },
  // Disable ESLint formatting rules that conflict with Prettier
  configPrettier,
]);
