import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import reactCompiler from "eslint-plugin-react-compiler";
import neostandard from "neostandard";
import tseslint from "typescript-eslint";

const compat = new FlatCompat();

export default tseslint.config(
  // Base
  eslint.configs.recommended,

  // Standard
  ...neostandard({ noStyle: true }),

  // Next
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  {
    ignores: [".next/*"],
  },

  // TypeScript
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },

  // React Compiler
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },

  // Custom rules
  {
    rules: {
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
        {
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },

  // Disable type-aware linting for config files
  {
    files: ["*.config.{js,ts,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
