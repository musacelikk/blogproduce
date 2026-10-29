import { SchemaStatement } from '../schema-migrator.service';

/**
 * `generation_jobs.stage` — which pipeline stage a job is currently running.
 *
 * Nullable with no default, so jobs that predate this column (and jobs from a
 * process that has not been redeployed yet) simply report no stage rather than
 * claiming a wrong one.
 */
export const GENERATION_JOB_STAGE_005: SchemaStatement[] = [
  {
    sql: `ALTER TABLE generation_jobs
          ADD COLUMN IF NOT EXISTS stage varchar(16) NULL`,
  },
];
