import { type CoreApiClient } from 'twenty-client-sdk/core';

import { type LastContactMethod } from 'src/constants/last-contact-method';
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
};
