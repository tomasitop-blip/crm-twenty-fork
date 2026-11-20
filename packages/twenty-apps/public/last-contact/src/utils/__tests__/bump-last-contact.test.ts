import { type CoreApiClient } from 'twenty-client-sdk/core';
import { describe, expect, it, vi } from 'vitest';

import { bumpLastContact } from 'src/utils/bump-last-contact';

describe('bumpLastContact', () => {
  it('only saves the last-contact metadata on the person', async () => {
    const mutation = vi
      .fn()
      .mockResolvedValueOnce({ updatePerson: { id: 'person-1' } });

    await bumpLastContact({ mutation } as unknown as CoreApiClient, {
      recordId: 'person-1',
      bumpedAt: '2026-11-20T12:00:00.000Z',
      method: 'TEXT',
      workspaceMemberId: 'member-1',
    });

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledWith({
      updatePerson: {
        __args: {
          id: 'person-1',
          data: {
            lastContactAt: '2026-11-20T12:00:00.000Z',
            lastOutboundAt: '2026-11-20T12:00:00.000Z',
            lastContactById: 'member-1',
            lastContactMethod: 'TEXT',
          },
        },
        id: true,
      },
    });
  });
});
