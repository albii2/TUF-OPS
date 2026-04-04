import { z } from 'zod';

export const updateOpportunitySchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(2).optional(),
  ownerId: z.coerce.number().nullable().optional(),
  stage: z.enum([
    'lead',
    'contacted',
    'mockup',
    'sample',
    'invoice',
    'closed_won',
    'closed_lost'
  ]).optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  closeDate: z.date().nullable().optional(),
  nextStep: z.string().min(1, "Next step is required.").optional(),
  nextStepDueDate: z.date().optional(),
});

export const quickUpdateOpportunitySchema = z.object({
  id: z.string(),
  stage: z.enum([
    'lead',
    'contacted',
    'mockup',
    'sample',
    'invoice',
    'closed_won',
    'closed_lost'
  ]),
  nextStep: z.string().min(1, "Next step is required."),
  nextStepDueDate: z.date(),
});

