import { describe, expect, it } from 'vitest';
import {
  cardHeadline,
  deferralTtlMs,
  isConfirmCard,
  isDecisionCard,
  type ConfirmCard,
  type DecisionCard,
} from '../cards';
import { findPresence, listActiveObjects, presenceLabel } from '../objects';

const decision: DecisionCard = {
  kind: 'decision',
  id: 'dc_1',
  createdAt: '2026-10-20T20:00:00.000Z',
  contentHash: 'abc',
  level: 'L2',
  subject: { kind: 'pr', ref: '#6', url: 'https://github.com/ima-jin/jin/pull/6' },
  question: 'Rebase or close?',
  options: [
    { letter: 'a', label: 'rebase', consequence: 'keeps the auth + seam' },
    { letter: 'b', label: 'close', consequence: 'starts over' },
  ],
  rec: { letter: 'a', why: 'the skeleton is right' },
};

const confirm: ConfirmCard = {
  kind: 'confirm',
  id: 'cf_1',
  createdAt: '2026-10-20T20:00:00.000Z',
  contentHash: 'def',
  level: 'L1',
  wish: 'share deck → Eric Holt',
  requester: 'did:imajin:agent',
  scope: 'media:share',
  executes: 'POST /media/api/share onBehalfOf did:imajin:ryan',
};

describe('card kit', () => {
  it('discriminates on kind', () => {
    expect(isDecisionCard(decision)).toBe(true);
    expect(isConfirmCard(decision)).toBe(false);
    expect(isConfirmCard(confirm)).toBe(true);
  });

  it('renders the record headline as a function of the payload', () => {
    expect(cardHeadline(decision)).toBe('DECISION · #6 · Rebase or close?');
    expect(cardHeadline(confirm)).toBe('share deck → Eric Holt · media:share');
  });

  it('turns deferrals into TTLs and final answers into none', () => {
    expect(deferralTtlMs('defer-5m')).toBe(5 * 60_000);
    expect(deferralTtlMs('defer-24h')).toBe(24 * 60 * 60_000);
    expect(deferralTtlMs('yes')).toBeNull();
    expect(deferralTtlMs('no')).toBeNull();
  });
});

describe('scene', () => {
  it('starts with exactly one idle presence object', () => {
    const objects = listActiveObjects();
    expect(objects).toHaveLength(1);
    const presence = findPresence(objects);
    expect(presence?.state).toBe('idle');
    expect(presence?.composition).toBeNull();
  });

  it('labels every presence state', () => {
    expect(presenceLabel('idle')).toBe('Jin is here.');
    expect(presenceLabel('waiting')).toBe('Jin needs you.');
  });
});
