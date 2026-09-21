export interface Assessment {
  id: string;
  moduleId: string;
  courseSlug: string;
  title: string;
  instructions: string;
  rubric: string;
  maxScore: number;
  allowedFormats: string[];
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}
