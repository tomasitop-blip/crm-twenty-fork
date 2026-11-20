import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LAST_CONTACT_METHODS } from 'src/constants/last-contact-method';
import { LAST_CONTACT_METHOD_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LAST_CONTACT_METHOD_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'lastContactMethod',
  type: FieldType.SELECT,
  label: 'Last contact method',
  description:
    'How the most recent contact with this person happened, including manual bumps.',
  icon: 'IconMessage',
  isNullable: true,
  isAuditLogged: false,
  options: LAST_CONTACT_METHODS.map(
    ({ optionId, value, label, color, position }) => ({
      id: optionId,
      value,
      label,
      color,
      position,
    }),
  ),
});
