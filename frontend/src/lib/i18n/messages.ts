import type { en } from "./dictionaries/en";

/** The dictionary shape every locale must match exactly — English is the source of truth (see
 * `dictionaries/en.ts`). Kept in its own module so `zh.ts`/`it.ts` can import the type without
 * pulling in `en.ts`'s actual values. */
export type Messages = typeof en;
