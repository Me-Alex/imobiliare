import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // ── TypeScript rules ────────────────────────────────────
    // `any` is allowed at the call sites we have today (mostly API
    // boundary types) but should be discouraged. The `ban-ts-comment`
    // rule stays off because the codebase intentionally suppresses
    // diagnostics in a few narrow places.
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    "@typescript-eslint/no-require-imports": "off",

    // ── React rules ─────────────────────────────────────────
    // The `exhaustive-deps` and `purity` hooks are the most important
    // guards against subtle render / state bugs. The previous config
    // turned both off, which is the same as saying "we never want to
    // know". Re-enable as warnings so CI surfaces drift without
    // blocking unrelated work. Promote to errors once the codebase is
    // clean.
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/purity": "warn",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // ── Next.js rules ───────────────────────────────────────
    // The app intentionally uses raw `<img>` for cover/gallery
    // thumbnails served from Supabase Storage. Keep these off.
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // ── General JavaScript rules ────────────────────────────
    "prefer-const": "warn",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "warn",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "warn",
    "no-useless-escape": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "examples/**",
    "skills/**",
    ".vercel/**",
    "tool-results/**",
  ]
}];

export default eslintConfig;
