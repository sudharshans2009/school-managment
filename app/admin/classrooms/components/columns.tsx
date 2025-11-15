"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, Trash2, Users, Eye } from "lucide-react";
import Link from "next/link";

export interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
  classroomCode: string;
  classroomKey?: string | null;
  currentStrength?: number | null;
  capacity?: number | null;
  academicYear?: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  teacherAssignments: Array<{
    isPrimary: boolean | null;
    teacher: { name: string };
    subject?: { name: string } | null;
  }>;
  students: Array<{ id: string }>;
}

interface ClassroomColumnsProps {
  onDelete: (classroom: Classroom) => void;
}

export const createClassroomColumns = ({
  onDelete,
}: ClassroomColumnsProps): ColumnDef<Classroom>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const classroom = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{classroom.name}</span>
          <span className="text-xs text-muted-foreground">
            Code: {classroom.classroomCode}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => {
      const classroom = row.original;
      return (
        <Badge variant="secondary">
          {classroom.grade}
          {classroom.section}
        </Badge>
      );
    },
  },
  {
    id: "students",
    header: "Students",
    cell: ({ row }) => {
      const classroom = row.original;
      return (
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2 text-gray-500" />
          {classroom.students.length}
        </div>
      );
    },
  },
  {
    id: "classTeacher",
    header: "Class Teacher",
    cell: ({ row }) => {
      const classroom = row.original;
      const primary = classroom.teacherAssignments.find((a) => a.isPrimary);
      return (
        <span className="text-sm">
          {primary?.teacher.name || "Not assigned"}
        </span>
      );
    },
  },
  {
    id: "teachers",
    header: "Teachers",
    cell: ({ row }) => {
      const classroom = row.original;
      return (
        <Badge variant="outline" className="text-xs">
          {classroom.teacherAssignments.length} assigned
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const classroom = row.original;
      return (
        <div className="flex gap-2">
          <Link href={`/admin/classrooms/${classroom.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/admin/classrooms/${classroom.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(classroom)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
