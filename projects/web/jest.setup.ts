import { TextDecoder, TextEncoder } from 'node:util';
import '@testing-library/jest-dom';

// jsdom doesn't provide TextEncoder/TextDecoder, which some Next internals
// (pulled in transitively by server-action modules) expect.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// `next/cache` eagerly pulls in server-only request internals that reference the
// Web `Request` global (which jsdom strips). Comment/engagement server actions
// import it transitively, so stub it to a no-op for the component tests.
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
