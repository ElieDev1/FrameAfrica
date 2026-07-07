import { TextDecoder, TextEncoder } from 'node:util';
import '@testing-library/jest-dom';

// jsdom doesn't provide TextEncoder/TextDecoder, which some Next internals
// (pulled in transitively by server-action modules) expect.
Object.assign(globalThis, { TextEncoder, TextDecoder });
