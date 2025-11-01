import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { studentGrades, exams, teacherAssignments, students } from '@/database/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { calculateLetterGrade } from '@/lib/helpers';

// GET /api/exams/[id]/grades - Get all grades for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // For students, they can only see their own grade if the exam is finalized
    if (session.user.role === 'student') {
      const [exam] = await db.select().from(exams).where(eq(exams.id, id));

      if (!exam || !exam.isFinalized) {
        return NextResponse.json({ error: 'Exam not found or not finalized' }, { status: 404 });
      }

      const [studentRecord] = await db
        .select()
        .from(students)
        .where(eq(students.userId, session.user.id));

      if (!studentRecord) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }

      const grade = await db
        .select({
          id: studentGrades.id,
          marksObtained: studentGrades.marksObtained,
          grade: studentGrades.grade,
          percentage: studentGrades.percentage,
          remarks: studentGrades.remarks,
          isAbsent: studentGrades.isAbsent,
          uploadedAt: studentGrades.uploadedAt,
        })
        .from(studentGrades)
        .where(
          and(
            eq(studentGrades.examId, id),
            eq(studentGrades.studentId, studentRecord.id)
          )
        );

      return NextResponse.json(grade);
    }

    // For teachers and admins, return all grades
    const grades = await db
      .select({
        id: studentGrades.id,
        marksObtained: studentGrades.marksObtained,
        grade: studentGrades.grade,
        percentage: studentGrades.percentage,
        remarks: studentGrades.remarks,
        isAbsent: studentGrades.isAbsent,
        uploadedAt: studentGrades.uploadedAt,
        student: {
          id: students.id,
          rollNumber: students.rollNumber,
          admissionNumber: students.admissionNumber,
        },
      })
      .from(studentGrades)
      .leftJoin(students, eq(studentGrades.studentId, students.id))
      .where(eq(studentGrades.examId, id));

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

// POST /api/exams/[id]/grades - Upload grades (Teachers and Admins)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user.role !== 'teacher' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { grades } = body; // Array of { studentId, marksObtained, grade, remarks, isAbsent }

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { error: 'Grades array is required' },
        { status: 400 }
      );
    }

    // Check if exam exists and is not finalized
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.isFinalized) {
      return NextResponse.json(
        { error: 'Cannot upload grades for a finalized exam' },
        { status: 400 }
      );
    }

    // For teachers, verify they are assigned to the class/subject
    if (session.user.role === 'teacher') {
      const assignment = await db
        .select()
        .from(teacherAssignments)
        .where(
          and(
            eq(teacherAssignments.teacherId, session.user.id),
            eq(teacherAssignments.classroomId, exam.classroomId),
            eq(teacherAssignments.subjectId, exam.subjectId)
          )
        );

      if (assignment.length === 0) {
        return NextResponse.json(
          { error: 'You are not assigned to this class/subject' },
          { status: 403 }
        );
      }
    }

    const results = {
      success: [] as string[],
      errors: [] as { studentId: string; error: string }[],
    };

    // Process each grade
    for (const gradeData of grades) {
      try {
        const { studentId, marksObtained, remarks, isAbsent } = gradeData;

        if (!studentId) {
          results.errors.push({ studentId: 'unknown', error: 'Student ID is required' });
          continue;
        }

        // Validate marks
        if (!isAbsent && (marksObtained === undefined || marksObtained === null)) {
          results.errors.push({ studentId, error: 'Marks obtained is required for present students' });
          continue;
        }

        if (!isAbsent && (marksObtained < 0 || marksObtained > exam.totalMarks)) {
          results.errors.push({
            studentId,
            error: `Marks must be between 0 and ${exam.totalMarks}`,
          });
          continue;
        }

        // Calculate percentage
        const percentage = isAbsent ? 0 : ((marksObtained / exam.totalMarks) * 100);
        const percentageStr = percentage.toFixed(2);
        
        // Automatically calculate letter grade based on percentage
        const letterGrade = isAbsent ? 'F' : calculateLetterGrade(percentage);

        // Check if grade already exists
        const existingGrade = await db
          .select()
          .from(studentGrades)
          .where(
            and(
              eq(studentGrades.examId, id),
              eq(studentGrades.studentId, studentId)
            )
          );

        if (existingGrade.length > 0) {
          // Update existing grade
          await db
            .update(studentGrades)
            .set({
              marksObtained: marksObtained?.toString(),
              grade: letterGrade,
              percentage: percentageStr,
              remarks,
              isAbsent: isAbsent || false,
              uploadedBy: session.user.id,
              updatedAt: new Date(),
            })
            .where(eq(studentGrades.id, existingGrade[0].id));
        } else {
          // Insert new grade
          await db.insert(studentGrades).values({
            examId: id,
            studentId,
            marksObtained: marksObtained?.toString(),
            grade: letterGrade,
            percentage: percentageStr,
            remarks,
            isAbsent: isAbsent || false,
            uploadedBy: session.user.id,
          });
        }

        results.success.push(studentId);
      } catch (error) {
        results.errors.push({
          studentId: gradeData.studentId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error uploading grades:', error);
    return NextResponse.json({ error: 'Failed to upload grades' }, { status: 500 });
  }
}
