/**
 * Topic-planning output contract.
 *
 * Same dual-provider constraint as `ai/blog-content.schema.ts`: every object
 * sets `additionalProperties: false` and lists all of its properties as
 * `required`, which is what OpenAI strict `json_schema` and Anthropic
 * structured outputs both demand.
 */

export interface PlannedTopic {
  title: string;
  angle: string;
  primaryKeyword: string;
}

export interface TopicPlan {
  topics: PlannedTopic[];
}

export const TOPIC_PLAN_SCHEMA_NAME = 'topic_plan';

export const TOPIC_PLAN_JSON_SCHEMA: Record<string, any> = {
  type: 'object',
  additionalProperties: false,
  required: ['topics'],
  properties: {
    topics: {
      type: 'array',
      description: 'The planned article topics, ordered most valuable first.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'angle', 'primaryKeyword'],
        properties: {
          title: {
            type: 'string',
            description:
              'The article title as it would be published. Concrete and specific — not a category name. Max 90 characters.',
          },
          angle: {
            type: 'string',
            description:
              'One sentence on what this article argues or teaches, and why it differs from the others in this batch.',
          },
          primaryKeyword: {
            type: 'string',
            description: 'The single search phrase this article should rank for.',
          },
        },
      },
    },
  },
};
