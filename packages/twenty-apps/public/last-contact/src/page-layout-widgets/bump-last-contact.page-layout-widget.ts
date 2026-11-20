import {
  definePageLayoutWidget,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  BUMP_LAST_CONTACT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  BUMP_LAST_CONTACT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayoutWidget({
  universalIdentifier: BUMP_LAST_CONTACT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIER,
  pageLayoutTabUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.tabs.home
      .universalIdentifier,
  title: 'Bump last contact',
  type: 'FRONT_COMPONENT',
  // The person Home tab uses indexes 0, 1, 2 and 4; 3 keeps the widget below
  // the Fields widget (where the last-contact fields live) without a collision.
  position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 3 },
  configuration: {
    configurationType: 'FRONT_COMPONENT',
    frontComponentUniversalIdentifier:
      BUMP_LAST_CONTACT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  },
});
