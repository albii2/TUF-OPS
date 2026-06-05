import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/migrations/**"
    ]
  },

  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs"
    }
  },

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  },

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
