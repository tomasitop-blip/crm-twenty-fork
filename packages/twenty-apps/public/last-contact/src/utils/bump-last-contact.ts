import { type CoreApiClient } from 'twenty-client-sdk/core';

import {
  LAST_CONTACT_METHODS,
  type LastContactMethod,
} from 'src/constants/last-contact-method';
import { buildBumpLastContactData } from 'src/utils/bump-last-contact-data';

type BumpLastContactParams = {
  recordId: string;
  bumpedAt: string;
  method: LastContactMethod;
  workspaceMemberId: string | null;
};

export const bumpLastContact = async (
  client: CoreApiClient,
  { recordId, bumpedAt, method, workspaceMemberId }: BumpLastContactParams,
): Promise<void> => {
  await client.mutation({
    updatePerson: {
      __args: {
        id: recordId,
        data: buildBumpLastContactData({
          bumpedAt,
          method,
          workspaceMemberId,
        }),
      },
      id: true,
    },
  });

  const methodLabel =
    LAST_CONTACT_METHODS.find((option) => option.value === method)?.label ??
    method;

  const { createNote } = await client.mutation({
    createNote: {
      __args: {
        data: {
          title: `Last contact bumped — ${methodLabel}`,
          bodyV2: {
            markdown: `Contact method: ${methodLabel}\nBumped at: ${bumpedAt}`,
          },
        },
      },
      id: true,
    },
  });

  if (!createNote?.id) {
    throw new Error('Could not create timeline note');
  }

  await client.mutation({
    createNoteTarget: {
      __args: {
        data: { noteId: createNote.id, targetPersonId: recordId },
      },
      id: true,
    },
  });
};
