import { describe, expect, it } from 'vitest';

import { LAST_CONTACT_METHODS } from 'src/constants/last-contact-method';
import lastContactMethodField from 'src/fields/last-contact-method.field';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('last contact method field', () => {
  it('offers text, email, whatsapp and call', () => {
    expect(LAST_CONTACT_METHODS.map((method) => method.value)).toEqual([
      'TEXT',
      'EMAIL',
      'WHATSAPP',
      'CALL',
    ]);
  });

  it('uses stable uuid v4 option ids', () => {
    for (const option of LAST_CONTACT_METHODS) {
      expect(option.optionId).toMatch(UUID_V4);
    }
  });

  it('declares the options on a nullable person select field', () => {
    expect(lastContactMethodField.success).toBe(true);
    expect(lastContactMethodField.config.type).toBe('SELECT');
    expect(lastContactMethodField.config.isNullable).toBe(true);
    expect(lastContactMethodField.config.isAuditLogged).toBe(false);
    expect(lastContactMethodField.config.options).toHaveLength(4);
  });
});
