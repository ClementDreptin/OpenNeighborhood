/** @type {import("prettier").Config} */
const config = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "^react(.*)$",
    "^next(.*)$",
    "^node:(.*)$",
    "<THIRD_PARTY_MODULES>",
    "^[./]",
    "^@/(.*)$",
  ],
  importOrderSideEffects: false,
};

export default config;
