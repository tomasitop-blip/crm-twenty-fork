import { type CoreApiClient } from 'twenty-client-sdk/core';
import { describe, expect, it, vi } from 'vitest';

import { bumpLastContact } from 'src/utils/bump-last-contact';

describe('bumpLastContact', () => {
  it('records the method and timestamp on the person and in the timeline', async () => {
    const mutation = vi
      .fn()
      .mockResolvedValueOnce({ updatePerson: { id: 'person-1' } })
      .mockResolvedValueOnce({ createNote: { id: 'note-1' } })
      .mockResolvedValueOnce({ createNoteTarget: { id: 'target-1' } });

    await bumpLastContact({ mutation } as unknown as CoreApiClient, {
      recordId: 'person-1',
      bumpedAt: '2026-11-20T12:00:00.000Z',
      method: 'TEXT',
      workspaceMemberId: 'member-1',
    });

    expect(mutation).toHaveBeenCalledTimes(3);
    expect(mutation).toHaveBeenNthCalledWith(1, {
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
    expect(mutation).toHaveBeenNthCalledWith(2, {
      createNote: {
        __args: {
          data: {
            title: 'Last contact bumped — Text',
            bodyV2: {
              markdown:
                'Contact method: Text\nBumped at: 2026-11-20T12:00:00.000Z',
            },
          },
        },
        id: true,
      },
    });
    expect(mutation).toHaveBeenNthCalledWith(3, {
      createNoteTarget: {
        __args: {
          data: { noteId: 'note-1', targetPersonId: 'person-1' },
        },
        id: true,
      },
    });
  });

  it('does not link a note when note creation fails', async () => {
    const mutation = vi
      .fn()
      .mockResolvedValueOnce({ updatePerson: { id: 'person-1' } })
      .mockResolvedValueOnce({ createNote: undefined });

    await expect(
      bumpLastContact({ mutation } as unknown as CoreApiClient, {
        recordId: 'person-1',
        bumpedAt: '2026-11-20T12:00:00.000Z',
        method: 'TEXT',
        workspaceMemberId: 'member-1',
      }),
    ).rejects.toThrow('Could not create timeline note');

    expect(mutation).toHaveBeenCalledTimes(2);
  });
});
