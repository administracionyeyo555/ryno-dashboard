// Next 16 quitó `next lint`; ESLint corre directo con flat config (`npm run lint` = `eslint .`).
// Generado con `npx @next/codemod@canary next-lint-to-eslint-cli` y ajustado a mano.
import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  // `next lint` solo miraba app/, components/, lib/, hooks/... — scripts/ son utilidades
  // Node CJS (sync-metrics.js, claude-hook.js) que nunca pasaron por el linter.
  globalIgnores(["scripts/**"]),
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],
    rules: {
      // Reglas nuevas de eslint-plugin-react-hooks 7 (React Compiler). Marcan 13 sitios
      // existentes (setState dentro de useEffect). No son regresiones del upgrade:
      // se dejan como aviso para revisarlas aparte y no mezclar refactors con el salto.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);
