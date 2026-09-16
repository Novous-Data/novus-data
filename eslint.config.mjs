import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // `const { contentHtml: _contentHtml, ...summary } = issue` is how a body
    // is dropped from a list payload. The discarded name is intentional.
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    // The website must never depend on the Beehiiv feed. The RSS parser and
    // the sanitiser are build tools that live in scripts/ and run by hand;
    // if either is ever imported from src/ the site has quietly acquired a
    // runtime dependency on an external service. Fail the lint instead.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fast-xml-parser",
              message:
                "The RSS parser belongs to scripts/sync-issues.ts. Nothing under src/ may read the feed.",
            },
            {
              name: "sanitize-html",
              message:
                "Issue HTML is sanitised once, at sync time, in scripts/. Do not re-sanitise at request time.",
            },
          ],
          patterns: [
            {
              group: ["**/scripts/*", "../../../scripts/*"],
              message: "src/ must not import from scripts/. Build tools stay out of the site.",
            },
          ],
        },
      ],
    },
  },

  {
    // Pages and components go through the content layer's public API so the
    // source of issues stays swappable.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/content/sources", "@/lib/content/sources/*"],
              message:
                "Import from '@/lib/content' instead. Pages must not know which content source is in use.",
            },
            {
              group: ["@/lib/disruptions/sources", "@/lib/disruptions/sources/*"],
              message:
                "Import from '@/lib/disruptions' instead. The register's storage stays behind its public API.",
            },
            {
              group: ["@/lib/accounts/sources", "@/lib/accounts/sources/*"],
              message:
                "Import from '@/lib/accounts' instead. Which account store is in use is not a page's business.",
            },
          ],
        },
      ],
    },
  },

  {
    // /debug/content is the one page that legitimately inspects the local
    // files directly, because reporting on them is its entire job.
    files: ["src/app/debug/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "preview/**",
    "experiments/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
