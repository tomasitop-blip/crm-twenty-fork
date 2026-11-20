import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  t,
  useColorScheme,
  useSelectedRecordIds,
  useUserId,
} from 'twenty-sdk/front-component';

import {
  LAST_CONTACT_METHODS,
  type LastContactMethod,
} from 'src/constants/last-contact-method';
import { BUMP_LAST_CONTACT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { bumpLastContact } from 'src/utils/bump-last-contact';
import {
  readLastContactMethod,
  resolveWorkspaceMemberId,
} from 'src/utils/bump-last-contact-data';

const BumpLastContact = () => {
  const [recordId] = useSelectedRecordIds();
  const userId = useUserId();
  const colorScheme = useColorScheme();
  const [method, setMethod] = useState<LastContactMethod | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    setMethod(null);
    setIsMenuOpen(false);

    if (!recordId) {
      return;
    }

    void (async () => {
      try {
        const result = await new CoreApiClient().query({
          people: {
            __args: { filter: { id: { eq: recordId } }, first: 1 },
            edges: { node: { lastContactMethod: true } },
          },
        });

        const currentMethod = readLastContactMethod(
          result.people?.edges?.[0]?.node,
        );

        if (!isCancelled) {
          setMethod(currentMethod);
        }
      } catch {
        // An unreadable field leaves the picker empty; a method can still be chosen.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [recordId]);

  const handleBump = async () => {
    if (!recordId || !method || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const client = new CoreApiClient();
      const workspaceMemberId = await resolveWorkspaceMemberId(client, userId);

      if (userId && !workspaceMemberId) {
        throw new Error('Workspace member not found');
      }

      await bumpLastContact(client, {
        recordId,
        bumpedAt: new Date().toISOString(),
        method,
        workspaceMemberId,
      });

      enqueueSnackbar({
        message: t('Last contact bumped.'),
        variant: 'success',
      });
    } catch {
      enqueueSnackbar({
        message: t('Could not bump last contact. Try again.'),
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#e6e6ea' : '#1b1b1f';
  const borderColor = isDark ? '#3d3d47' : '#d5d5dd';
  const surfaceColor = isDark ? '#262630' : '#ffffff';
  const hoverColor = isDark ? '#33333f' : '#f1f1f5';
  const selectedLabel = LAST_CONTACT_METHODS.find(
    (option) => option.value === method,
  )?.label;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        color: textColor,
        fontFamily: 'inherit',
        fontSize: '13px',
      }}
    >
      <span style={{ fontWeight: 600 }}>{t('Bump last contact')}</span>
      <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
        <button
          type="button"
          aria-label={t('Contact method')}
          aria-expanded={isMenuOpen}
          disabled={isSaving}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            flex: 1,
            padding: '6px 10px',
            color: textColor,
            backgroundColor: surfaceColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {selectedLabel ?? t('Select a method')}
        </button>
        <button
          type="button"
          disabled={!recordId || !method || isSaving}
          onClick={() => void handleBump()}
          style={{
            padding: '6px 14px',
            color: '#ffffff',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: !recordId || !method || isSaving ? 0.5 : 1,
          }}
        >
          {isSaving ? t('Bumping…') : t('Bump')}
        </button>
        {isMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 10,
              minWidth: '150px',
              padding: '4px',
              backgroundColor: surfaceColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            {LAST_CONTACT_METHODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMethod(option.value);
                  setIsMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 8px',
                  color: textColor,
                  backgroundColor:
                    option.value === method ? hoverColor : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: BUMP_LAST_CONTACT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'bump-last-contact',
  description:
    'Manually bump last contact on a person and record how they were contacted.',
  component: BumpLastContact,
});
