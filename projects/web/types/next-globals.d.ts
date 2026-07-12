/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Next generates `next-env.d.ts` with these same references, but that file is
// git-ignored (and points at `.next/dev/types`, which only exists after a dev
// run). CI runs a bare `tsc --noEmit`, so without this committed reference the
// static-image imports (`import logo from '@/public/brand/logo.png'`) fail to
// resolve. Keep this file: it is what makes `pnpm typecheck` work from a clean
// checkout.
