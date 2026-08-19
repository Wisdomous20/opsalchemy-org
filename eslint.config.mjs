import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react/*",
                "openai",
                "@/application/*",
                "@/infrastructure/*",
                "@/server/*",
                "@/app/*",
                "@/components/*",
                "**/application/**",
                "**/infrastructure/**",
                "**/server/**",
                "**/app/**",
                "**/components/**",
              ],
              message:
                "Domain code must remain independent of frameworks, delivery, and infrastructure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react/*",
                "openai",
                "@/infrastructure/*",
                "@/server/*",
                "@/app/*",
                "@/components/*",
                "**/infrastructure/**",
                "**/server/**",
                "**/app/**",
                "**/components/**",
              ],
              message:
                "Application code may depend on domain contracts, not frameworks or infrastructure adapters.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
