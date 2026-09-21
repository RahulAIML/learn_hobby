export interface Course {
  slug: string;
  title: string;
}

export interface CourseDocument {
  id: string;
  courseSlug: string;
  moduleId: string | null;
  title: string;
  filename: string;
  mimeType: string;
  /** Base64-encoded raw file bytes. */
  data: string;
  sizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
}

/** Shape returned to clients — never includes the base64 payload (fetched separately via the download route). */
export interface CourseDocumentSummary {
  id: string;
  courseSlug: string;
  moduleId: string | null;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
}

export function toSummary(doc: CourseDocument): CourseDocumentSummary {
  const { data: _data, ...summary } = doc;
  return summary;
}
