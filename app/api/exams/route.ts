import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { exams, subjects, classrooms } from '@/database/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, desc, SQL } from 'drizzle-orm';

// GET /api/exams - Get all exams (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const subjectId = searchParams.get('subjectId');
    const isFinalized = searchParams.get('isFinalized');
    const examType = searchParams.get('examType');

    const conditions: SQL<unknown>[] = [];
    if (classroomId) conditions.push(eq(exams.classroomId, classroomId));
    if (subjectId) conditions.push(eq(exams.subjectId, subjectId));
    if (isFinalized !== null && isFinalized !== undefined) {
      conditions.push(eq(exams.isFinalized, isFinalized === 'true'));
    }
    if (examType) {
      conditions.push(eq(exams.examType, examType as 'class_test' | 'unit_test' | 'quarterly' | 'midterm' | 'final_exam'));
    }

    const examsList = await db
      .select({
        id: exams.id,
        name: exams.name,
        examType: exams.examType,
        examDate: exams.examDate,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        duration: exams.duration,
        syllabus: exams.syllabus,
        instructions: exams.instructions,
        isFinalized: exams.isFinalized,
        academicYear: exams.academicYear,
        term: exams.term,
        createdAt: exams.createdAt,
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
        classroom: {
          id: classrooms.id,
          name: classrooms.name,
          grade: classrooms.grade,
          section: classrooms.section,
        },
      })
      .from(exams)
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .leftJoin(classrooms, eq(exams.classroomId, classrooms.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(exams.examDate));

    return NextResponse.json(examsList);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST /api/exams - Create a new exam (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      examType,
      subjectId,
      classroomId,
      examDate,
      totalMarks,
      passingMarks,
      duration,
      syllabus,
      instructions,
      academicYear,
      term,
    } = body;

    if (!name || !examType || !subjectId || !classroomId || !examDate || !totalMarks || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newExam] = await db
      .insert(exams)
      .values({
        name,
        examType,
        subjectId,
        classroomId,
        examDate: new Date(examDate),
        totalMarks,
        passingMarks,
        duration,
        syllabus,
        instructions,
        academicYear,
        term,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newExam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
