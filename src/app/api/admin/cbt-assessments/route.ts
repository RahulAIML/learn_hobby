import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { assessmentInputSchema } from '@/lib/cbt/validation';
import { createCbtAssessment, listCbtAssessments } from '@/lib/cbt/store';
export const runtime = 'nodejs';
export async function GET(req:NextRequest){const auth=requireAdmin(req);if('response'in auth)return auth.response;return NextResponse.json({success:true,assessments:await listCbtAssessments()});}
export async function POST(req:NextRequest){const auth=requireAdmin(req);if('response'in auth)return auth.response;let body:unknown;try{body=await req.json()}catch{return NextResponse.json({success:false,error:{code:'invalid_request',message:'Invalid request.'}},{status:400})}const parsed=assessmentInputSchema.safeParse(body);if(!parsed.success)return NextResponse.json({success:false,error:{code:'validation_error',message:parsed.error.issues[0]?.message??'Invalid assessment.'}},{status:400});return NextResponse.json({success:true,assessment:await createCbtAssessment(parsed.data,auth.user.id)},{status:201});}
