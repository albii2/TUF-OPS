
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default [
  // Global ignores
  {
    ignores: ["**/node_modules/", "**/dist/", "**/migrations/"]
  },

  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs"
    }
  },

  // Base JS config
  js.configs.recommended,

  // TypeScript configs
  ...tseslint.configs.recommended,

  // Custom rules for the project
  {
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["@packages/package-a"],
          "message": "Direct imports from @packages/package-a are forbidden. Use a shared package instead."
        }]
      }]
    }
  }
];
