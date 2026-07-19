import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.ts"],

    languageOptions: {
      globals: globals.node,

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      // Allow console logs on the backend
      "no-console": "off",

      // Downgrade 'any' type errors to warnings so they don't block build pipelines
      "@typescript-eslint/no-explicit-any": "warn",

      // Ignore unused variables and arguments if they start with an underscore (e.g. _next, _error)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allow namespaces for extending Express global types (e.g., Request.user)
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    },
  },
);
