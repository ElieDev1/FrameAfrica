import { ServiceUnavailableException } from '@nestjs/common';
import type { AdminSettingsService } from '../admin/admin-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

/** The shape of a request the service sends — enough of it to assert on. */
interface SentRequest {
  model: string;
  output_config: { format: { type: string } };
  messages: { role: string; content: string }[];
}

// Capture what we would send to Anthropic, and answer with whatever the test wants.
const create = jest.fn<Promise<unknown>, [SentRequest]>();
const constructed: { apiKey?: string }[] = [];

/** The prompt the service actually sent. */
function sentPrompt(): string {
  return create.mock.calls[0][0].messages[0].content;
}

jest.mock('@anthropic-ai/sdk', () => {
  // Defined inside the factory: jest.mock is hoisted above module-level code, so a
  // class declared outside isn't initialised yet when this runs.
  class MockAPIError extends Error {
    constructor(
      readonly status: number,
      readonly error: unknown,
    ) {
      super('api error');
    }
  }
  const ctor = jest.fn().mockImplementation((opts: { apiKey?: string }) => {
    constructed.push(opts);
    return { messages: { create } };
  }) as jest.Mock & { APIError: typeof MockAPIError };
  // The service does `error instanceof Anthropic.APIError` — the mock must carry it.
  ctor.APIError = MockAPIError;
  return { __esModule: true, default: ctor };
});

// The mock's APIError class, for tests that simulate a provider error.
const mockedSdk = jest.requireMock<{
  default: { APIError: new (status: number, error: unknown) => Error };
}>('@anthropic-ai/sdk');
const MockAPIError = mockedSdk.default.APIError;

/** An Anthropic reply carrying a JSON payload, the way structured output arrives. */
function reply(payload: unknown, stopReason = 'end_turn') {
  return {
    stop_reason: stopReason,
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
}

function build(settings: Record<string, string> = { ANTHROPIC_API_KEY: 'sk-ant-test' }) {
  const admin = { getValue: jest.fn((k: string) => Promise.resolve(settings[k] ?? null)) };
  const prisma = {
    category: { findMany: jest.fn().mockResolvedValue([]) },
    topic: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new AiService(
    admin as unknown as AdminSettingsService,
    prisma as unknown as PrismaService,
  );
  return { service, admin, prisma };
}

const STORY =
  'Rwanda has opened a new inland port at Rusizi to shorten the route to Bukavu. '.repeat(6);

describe('AiService', () => {
  beforeEach(() => {
    create.mockReset();
    constructed.length = 0;
  });

  it('refuses cleanly, and calls nobody, when no key is configured', async () => {
    const { service } = build({});

    await expect(service.summarize(STORY)).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.summarize(STORY)).rejects.toThrow(/Settings/); // tells the admin where to fix it
    expect(create).not.toHaveBeenCalled();
  });

  it('reports whether assist is switched on', async () => {
    expect(await build({}).service.status()).toEqual({
      configured: false,
      model: 'claude-opus-4-8',
    });
    expect(await build().service.status()).toEqual({ configured: true, model: 'claude-opus-4-8' });
  });

  it('uses the key from Settings, not the environment', async () => {
    const { service } = build({ ANTHROPIC_API_KEY: 'sk-ant-from-dashboard' });
    create.mockResolvedValue(reply({ summary: 'A new port.', bullets: ['One.', 'Two.'] }));

    await service.summarize(STORY);

    expect(constructed[0].apiKey).toBe('sk-ant-from-dashboard');
  });

  it('summarises in the article’s own language', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({ summary: 'Ikigo gishya.', bullets: ['Rimwe.'] }));

    const res = await service.summarize(STORY, 'rw');

    const prompt = sentPrompt();
    expect(prompt).toContain('Kinyarwanda');
    expect(res.summary).toBe('Ikigo gishya.');
  });

  it('asks for JSON so the editor never has to strip a preamble', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({ headlines: ['A', 'B'], standfirst: 'S' }));

    await service.headlines(STORY);

    const req = create.mock.calls[0][0];
    expect(req.output_config.format.type).toBe('json_schema');
    expect(req.model).toBe('claude-opus-4-8');
  });

  it('honours a model override from Settings', async () => {
    const { service } = build({ ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'claude-haiku-4-5' });
    create.mockResolvedValue(reply({ headlines: [], standfirst: '' }));

    await service.headlines(STORY);

    expect(create.mock.calls[0][0].model).toBe('claude-haiku-4-5');
  });

  it('grounds tags in the taxonomy that actually exists', async () => {
    const { service, prisma } = build();
    prisma.category.findMany.mockResolvedValue([{ name: 'Business' }, { name: 'Politics' }]);
    prisma.topic.findMany.mockResolvedValue([{ name: 'Trade' }]);
    create.mockResolvedValue(reply({ category: 'business', tags: ['Trade', 'Rusizi'] }));

    const res = await service.tags(STORY);

    const prompt = sentPrompt();
    expect(prompt).toContain('Business, Politics'); // the real sections
    expect(prompt).toContain('Trade'); // the real tags
    expect(res.category).toBe('Business'); // matched case-insensitively to the real name
    expect(res.tags).toEqual(['Trade', 'Rusizi']);
  });

  it('drops a section that does not exist rather than inventing one', async () => {
    const { service, prisma } = build();
    prisma.category.findMany.mockResolvedValue([{ name: 'Business' }]);
    create.mockResolvedValue(reply({ category: 'Logistics & Ports', tags: ['Trade'] }));

    const res = await service.tags(STORY);

    expect(res.category).toBeNull(); // the editor picks, rather than being handed a bad file
    expect(res.tags).toEqual(['Trade']);
  });

  it('translates the headline alongside the body', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({ title: 'Nouveau port', text: 'Le Rwanda a ouvert…' }));

    const res = await service.translate(STORY, 'fr', 'New port opens');

    const prompt = sentPrompt();
    expect(prompt).toContain('French');
    expect(prompt).toContain('New port opens');
    expect(res).toEqual({ title: 'Nouveau port', text: 'Le Rwanda a ouvert…' });
  });

  it('reports an empty translated headline as none, not as an empty string', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({ title: '', text: 'Le Rwanda a ouvert…' }));

    expect((await service.translate(STORY, 'fr')).title).toBeNull();
  });

  it('turns a provider outage into a 503, not a 500', async () => {
    const { service } = build();
    create.mockRejectedValue(new Error('529 overloaded'));

    await expect(service.summarize(STORY)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('tells the newsroom when the provider account is out of credit', async () => {
    const { service } = build();
    create.mockRejectedValue(
      new MockAPIError(400, {
        error: { message: 'Your credit balance is too low to access the Anthropic API.' },
      }),
    );

    // Actionable, not a vague "unavailable" — this is a top-up, not a retry.
    await expect(service.summarize(STORY)).rejects.toThrow(/out of credit/i);
  });

  it('tells the admin when the key itself is rejected', async () => {
    const { service } = build();
    create.mockRejectedValue(new MockAPIError(401, { error: { message: 'invalid x-api-key' } }));

    await expect(service.summarize(STORY)).rejects.toThrow(/key was rejected|Settings/i);
  });

  it('does not hand the editor an unparseable answer', async () => {
    const { service } = build();
    create.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'oops' }],
    });

    await expect(service.summarize(STORY)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('surfaces a refusal instead of silently returning nothing', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({}, 'refusal'));

    await expect(service.summarize(STORY)).rejects.toThrow(/declined/);
  });

  it('clamps a very long feature so a two-line summary does not cost a fortune', async () => {
    const { service } = build();
    create.mockResolvedValue(reply({ summary: 's', bullets: [] }));

    await service.summarize('word '.repeat(20_000)); // ~100k chars

    const prompt = sentPrompt();
    expect(prompt.length).toBeLessThan(25_000);
    expect(prompt).toContain('…'); // and the truncation is visible to the model
  });
});
