import { SchemaStatement } from '../schema-migrator.service';

/**
 * `autopilot_configs.promotion` — the product the site wants every article to
 * recommend, plus the call to action. Nullable: configs without it keep
 * producing plain editorial content exactly as before.
 */
export const AUTOPILOT_PROMOTION_006: SchemaStatement[] = [
  {
    sql: `ALTER TABLE autopilot_configs
          ADD COLUMN IF NOT EXISTS promotion text NULL`,
  },
];
