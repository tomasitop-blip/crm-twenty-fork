import { type CoreApiClient } from 'twenty-client-sdk/core';
import { describe, expect, it, vi } from 'vitest';

import {
  buildBumpLastContactData,
  readLastContactMethod,
  resolveWorkspaceMemberId,
} from 'src/utils/bump-last-contact-data';

describe('bump last contact data', () => {
  it('reads the method from a select field value', () => {
    expect(readLastContactMethod({ lastContactMethod: { value: 'WHATSAPP' } }))
      .toBe('WHATSAPP');
    expect(readLastContactMethod({ lastContactMethod: 'CALL' })).toBe('CALL');
  });

  it('ignores empty or unknown methods', () => {
    expect(readLastContactMethod({ lastContactMethod: null })).toBeNull();
    expect(readLastContactMethod({ lastContactMethod: { value: 'CARRIER' } }))
      .toBeNull();
    expect(readLastContactMethod(null)).toBeNull();
  });

  it('builds the full bump payload', () => {
    expect(
      buildBumpLastContactData({
        bumpedAt: '2026-11-20T12:00:00.000Z',
        method: 'TEXT',
        workspaceMemberId: 'member-1',
      }),
    ).toEqual({
      lastContactAt: '2026-11-20T12:00:00.000Z',
      lastOutboundAt: '2026-11-20T12:00:00.000Z',
      lastContactById: 'member-1',
      lastContactMethod: 'TEXT',
    });
  });

  it('keeps the contact author null when no user is known', () => {
    expect(
      buildBumpLastContactData({
        bumpedAt: '2026-11-20T12:00:00.000Z',
        method: 'EMAIL',
        workspaceMemberId: null,
      }).lastContactById,
    ).toBeNull();
  });

  it('resolves the acting workspace member by user id', async () => {
    const query = vi.fn().mockResolvedValue({
      workspaceMembers: { edges: [{ node: { id: 'member-1' } }] },
    });

    const result = await resolveWorkspaceMemberId(
      { query } as unknown as CoreApiClient,
      'user-1',
    );

    expect(result).toBe('member-1');
    expect(query).toHaveBeenCalledWith({
      workspaceMembers: {
        __args: { filter: { userId: { eq: 'user-1' } }, first: 1 },
        edges: { node: { id: true } },
      },
    });
  });

  it('does not query without a user id', async () => {
    const query = vi.fn();

    const result = await resolveWorkspaceMemberId(
      { query } as unknown as CoreApiClient,
      null,
    );

    expect(result).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
});
