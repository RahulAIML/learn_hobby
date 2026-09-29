import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { assessmentInputSchema } from '@/lib/cbt/validation';
import { createCbtAssessment, listCbtAssessments, getCbtAssessmentStats } from '@/lib/cbt/store';
export const runtime = 'nodejs';
/** Real attempt count + average score per assessment — no mock stats, computed live for every row. */
export async function GET(req:NextRequest){const auth=requireAdmin(req);if('response'in auth)return auth.response;const assessments=await listCbtAssessments();const withStats=await Promise.all(assessments.map(async(a)=>({...a,...(await getCbtAssessmentStats(a.id))})));return NextResponse.json({success:true,assessments:withStats});}
export async function POST(req:NextRequest){const auth=requireAdmin(req);if('response'in auth)return auth.response;let body:unknown;try{body=await req.json()}catch{return NextResponse.json({success:false,error:{code:'invalid_request',message:'Invalid request.'}},{status:400})}const parsed=assessmentInputSchema.safeParse(body);if(!parsed.success)return NextResponse.json({success:false,error:{code:'validation_error',message:parsed.error.issues[0]?.message??'Invalid assessment.'}},{status:400});return NextResponse.json({success:true,assessment:await createCbtAssessment(parsed.data,auth.user.id)},{status:201});}
