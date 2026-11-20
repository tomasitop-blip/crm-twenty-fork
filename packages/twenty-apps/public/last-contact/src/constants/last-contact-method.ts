import {
  LAST_CONTACT_METHOD_CALL_OPTION_ID,
  LAST_CONTACT_METHOD_EMAIL_OPTION_ID,
  LAST_CONTACT_METHOD_TEXT_OPTION_ID,
  LAST_CONTACT_METHOD_WHATSAPP_OPTION_ID,
} from 'src/constants/universal-identifiers';

export const LAST_CONTACT_METHODS = [
  {
    value: 'TEXT',
    label: 'Text',
    optionId: LAST_CONTACT_METHOD_TEXT_OPTION_ID,
    color: 'green',
    position: 0,
  },
  {
    value: 'EMAIL',
    label: 'Email',
    optionId: LAST_CONTACT_METHOD_EMAIL_OPTION_ID,
    color: 'blue',
    position: 1,
  },
  {
    value: 'WHATSAPP',
    label: 'WhatsApp',
    optionId: LAST_CONTACT_METHOD_WHATSAPP_OPTION_ID,
    color: 'purple',
    position: 2,
  },
  {
    value: 'CALL',
    label: 'Call',
    optionId: LAST_CONTACT_METHOD_CALL_OPTION_ID,
    color: 'orange',
    position: 3,
  },
] as const;

export type LastContactMethod = (typeof LAST_CONTACT_METHODS)[number]['value'];

export const isLastContactMethod = (
  value: unknown,
): value is LastContactMethod =>
  typeof value === 'string' &&
  LAST_CONTACT_METHODS.some((method) => method.value === value);
