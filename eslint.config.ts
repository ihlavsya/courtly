import type { ESLint } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import { checkPrefixForBooleanFunctions } from "./eslint-rules/check-prefix-for-boolean-functions.ts";
import { noComments } from "./eslint-rules/no-comments.ts";

export default defineConfig(globalIgnores(["dist/", "**/*.generated.ts"]), {
  files: ["**/*.ts", "**/*.tsx"],
  extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
  plugins: {
    local: {
      rules: { "check-prefix-for-boolean-functions": checkPrefixForBooleanFunctions, "no-comments": noComments },
    } as unknown as ESLint.Plugin,
  },
  languageOptions: {
    parserOptions: { projectService: true },
  },
  rules: {
    "local/check-prefix-for-boolean-functions": "error",
    "local/no-comments": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/only-throw-error": [
      "error",
      { allow: [{ from: "package", name: "Redirect", package: "@tanstack/router-core" }] },
    ],
    "@typescript-eslint/no-floating-promises": [
      "error",
      { allowForKnownSafeCalls: [{ from: "package", name: ["describe", "it"], package: "node:test" }] },
    ],
    eqeqeq: "error",
    "no-param-reassign": "error",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "default", format: ["camelCase"] },
      { selector: "typeLike", format: ["PascalCase"] },
      { selector: "function", format: ["camelCase", "PascalCase"] },
      {
        selector: "variable",
        modifiers: ["const", "global"],
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
      },
      {
        selector: ["variable", "parameter"],
        types: ["boolean"],
        format: ["PascalCase"],
        prefix: ["is", "has", "should", "can"],
      },
      { selector: "typeProperty", format: ["camelCase"], leadingUnderscore: "allow" },
      { selector: ["objectLiteralProperty", "objectLiteralMethod"], format: null },
    ],
  },
}, {
  files: ["web/src/router.tsx"],
  rules: {
    "@typescript-eslint/consistent-type-definitions": "off",
  },
});
