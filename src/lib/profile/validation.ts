import { z } from 'zod';
import { isValidGoalPath } from './goalTaxonomy';

export const MIN_AGE = 10;
export const MAX_AGE = 100;

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    mobile: z.string().trim().min(1).max(20).nullable().optional(),
    age: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    goalCategory: z.string().trim().min(1).max(100).optional(),
    goalSubcategory: z.string().trim().min(1).max(100).optional(),
    goalOption: z.string().trim().min(1).max(150).optional(),
  })
  .superRefine((data, ctx) => {
    const goalFields = [data.goalCategory, data.goalSubcategory, data.goalOption];
    const goalFieldsProvided = goalFields.filter((v) => v !== undefined).length;
    // Goal is a drill-down path: either all three levels are provided together, or none of them are.
    if (goalFieldsProvided > 0 && goalFieldsProvided < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'goalCategory, goalSubcategory, and goalOption must be provided together.' });
      return;
    }
    if (goalFieldsProvided === 3 && !isValidGoalPath(data.goalCategory!, data.goalSubcategory!, data.goalOption!)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'That goal selection is not a valid option.' });
    }
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
