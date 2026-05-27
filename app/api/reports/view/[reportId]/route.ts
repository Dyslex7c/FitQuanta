import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.reportId;
    
    await connectDB();
    const report = await Report.findById(reportId).lean();
    
    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }
    
    return new NextResponse(report.htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('[REPORT VIEW ROUTE ERROR]', error);
    return new NextResponse('Something went wrong loading the report', { status: 500 });
  }
}
