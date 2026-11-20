import { type CoreApiClient } from 'twenty-client-sdk/core';

import {
  isLastContactMethod,
  type LastContactMethod,
} from 'src/constants/last-contact-method';

type LastContactMethodValue = {
  value?: string | null;
};

type PersonLastContactNode = {
  lastContactMethod?: LastContactMethodValue | string | null;
};

type BumpLastContactDataParams = {
  bumpedAt: string;
  method: LastContactMethod;
  workspaceMemberId: string | null;
};

export const readLastContactMethod = (
  node: PersonLastContactNode | null | undefined,
): LastContactMethod | null => {
  const value =
    typeof node?.lastContactMethod === 'string'
      ? node.lastContactMethod
      : node?.lastContactMethod?.value;

  return isLastContactMethod(value) ? value : null;
};

export const resolveWorkspaceMemberId = async (
  client: CoreApiClient,
  userId: string | null,
): Promise<string | null> => {
  if (!userId) {
    return null;
  }

  const result = await client.query({
    workspaceMembers: {
      __args: {
        filter: { userId: { eq: userId } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  });

  return result.workspaceMembers?.edges?.[0]?.node?.id ?? null;
};

export const buildBumpLastContactData = ({
  bumpedAt,
  method,
  workspaceMemberId,
}: BumpLastContactDataParams): Record<string, string | null> => ({
  lastContactAt: bumpedAt,
  lastOutboundAt: bumpedAt,
  lastContactById: workspaceMemberId,
  lastContactMethod: method,
});
