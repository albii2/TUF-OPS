import { z } from 'zod';

export const updateOpportunitySchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  ownerId: z.string().nullable().optional(),
  stage: z.enum([
    'lead',
    'contacted',
    'mockup',
    'sample',
    'invoice',
    'closed_won',
    'closed_lost'
  ]),
  estimatedValue: z.number().min(0), // Changed from expectedValue
  closeDate: z.date().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  nextStepDueDate: z.date().nullable().optional(),
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
  nextStep: z.string().nullable().optional(),
  nextStepDueDate: z.date().nullable().optional(),
});

