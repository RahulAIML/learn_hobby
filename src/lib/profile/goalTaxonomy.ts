/**
 * Configurable drill-down goal taxonomy for student onboarding. Editing this
 * file is how the options are "configured" — no separate admin UI for it
 * yet, but every consumer (frontend selector, backend validation) reads
 * from this single source, so adding/removing an option only requires a
 * change here.
 */

export interface GoalOption {
  value: string;
  label: string;
}

export interface GoalSubcategory {
  value: string;
  label: string;
  options: GoalOption[];
}

export interface GoalCategory {
  value: string;
  label: string;
  subcategories: GoalSubcategory[];
}

export const GOAL_TAXONOMY: GoalCategory[] = [
  {
    value: 'career',
    label: 'Career',
    subcategories: [
      {
        value: 'job_search',
        label: 'Job Search',
        options: [
          { value: 'first_job', label: 'Get my first job' },
          { value: 'switch_career', label: 'Switch career' },
          { value: 'higher_paying_job', label: 'Get a higher-paying job' },
          { value: 'interview_prep', label: 'Prepare for interviews' },
        ],
      },
    ],
  },
  {
    value: 'education',
    label: 'Education',
    subcategories: [
      {
        value: 'academics',
        label: 'Academics',
        options: [
          { value: 'learn_data_science', label: 'Learn Data Science' },
          { value: 'learn_ai_ml', label: 'Learn AI/ML' },
          { value: 'improve_academic_performance', label: 'Improve academic performance' },
        ],
      },
    ],
  },
  {
    value: 'skill_development',
    label: 'Skill Development',
    subcategories: [
      {
        value: 'programming',
        label: 'Programming',
        options: [
          { value: 'learn_python', label: 'Learn Python' },
          { value: 'learn_sql', label: 'Learn SQL' },
          { value: 'learn_machine_learning', label: 'Learn Machine Learning' },
          { value: 'build_projects', label: 'Build projects' },
        ],
      },
    ],
  },
];

export function findGoalCategory(categoryValue: string): GoalCategory | undefined {
  return GOAL_TAXONOMY.find((c) => c.value === categoryValue);
}

export function findGoalSubcategory(categoryValue: string, subcategoryValue: string): GoalSubcategory | undefined {
  return findGoalCategory(categoryValue)?.subcategories.find((s) => s.value === subcategoryValue);
}

/** True only if category/subcategory/option form a real path through the taxonomy. */
export function isValidGoalPath(categoryValue: string, subcategoryValue: string, optionValue: string): boolean {
  const subcategory = findGoalSubcategory(categoryValue, subcategoryValue);
  return !!subcategory?.options.some((o) => o.value === optionValue);
}
