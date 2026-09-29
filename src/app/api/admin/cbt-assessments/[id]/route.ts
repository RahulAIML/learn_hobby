import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { assessmentUpdateSchema } from '@/lib/cbt/validation';
import {
	getCbtAssessment,
	listAdminQuestions,
	updateCbtAssessment,
	deleteCbtAssessment,
	getCbtAssessmentStats,
	listAttemptsByAssessment,
} from '@/lib/cbt/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	const auth = requireAdmin(req);
	if ('response' in auth) return auth.response;
	const assessment = await getCbtAssessment(params.id);
	if (!assessment) return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Assessment not found.' } }, { status: 404 });
	const [questions, stats, attempts] = await Promise.all([
		listAdminQuestions(assessment.id),
		getCbtAssessmentStats(assessment.id),
		listAttemptsByAssessment(assessment.id),
	]);
	return NextResponse.json({ success: true, assessment, questions, stats, attempts });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
	const auth = requireAdmin(req);
	if ('response' in auth) return auth.response;
	let body: unknown;
	try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Invalid request.' } }, { status: 400 }); }
	const parsed = assessmentUpdateSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'validation_error', message: 'Invalid assessment.' } }, { status: 400 });
	const assessment = await updateCbtAssessment(params.id, parsed.data);
	return assessment ? NextResponse.json({ success: true, assessment }) : NextResponse.json({ success: false, error: { code: 'not_found', message: 'Assessment not found.' } }, { status: 404 });
}

/** Admin: permanently delete an assessment — cascades to its questions, attempts, and answers. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	const auth = requireAdmin(req);
	if ('response' in auth) return auth.response;
	const deleted = await deleteCbtAssessment(params.id);
	if (!deleted) return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Assessment not found.' } }, { status: 404 });
	return NextResponse.json({ success: true });
}
