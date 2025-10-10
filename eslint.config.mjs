import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import reactCompiler from "eslint-plugin-react-compiler";
import { defineConfig } from "eslint/config";
import neostandard from "neostandard";
import tseslint from "typescript-eslint";

const compat = new FlatCompat();

export default defineConfig(
  // Base
  eslint.configs.recommended,

  // Standard
  ...neostandard({ noStyle: true }),

  // Next
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  { ignores: [".next/*", "next-env.d.ts"] },

  // TypeScript
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { project: "./tsconfig.json" } } },

  // React Compiler
  reactCompiler.configs.recommended,

  // Custom rules
  {
    rules: {
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "no-void": "off",
    },
  },

  // Disable type-aware linting for config files
  {
    files: ["*.config.{js,ts,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
