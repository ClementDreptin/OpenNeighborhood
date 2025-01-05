/** @type {import("prettier").Config} */
const config = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: ["^react(.*)$", "<THIRD_PARTY_MODULES>", "^[./]", "^@/(.*)$"],
};

export default config;
