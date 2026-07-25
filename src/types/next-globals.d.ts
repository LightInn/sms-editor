/// <reference types="next" />

// TypeScript 7 rejects a side-effect import of a module it has no declaration
// for (TS2882) — `import './typewriter-loader.css'` used to be silently allowed.
//
// The app's program gets those declarations from the generated `next-env.d.ts` at
// the repo root, but this package's program does not: its `include` is relative
// to `sms-editor/`, where no such file exists. It still type-checks files from
// `../src` (its `@/*` alias points there), so it hits the CSS imports without the
// declarations that make them legal.
//
// Referencing Next's types is enough — `next/types/global.d.ts` declares
// `*.css`, `*.svg` and friends. Redeclaring `*.css` here instead would collide
// with Next's declaration in the root program, which globs this directory too.
//
// No `export {}`: this must stay a global script file, not a module.
