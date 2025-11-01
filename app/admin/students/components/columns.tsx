"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

export interface Student {
  id: string;
  rollNumber: string;
  admissionNumber: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  classroom: {
    name: string;
    grade: string;
    section: string;
  } | null;
  dateOfBirth: string;
  bloodGroup: string | null;
}

interface StudentColumnsProps {
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const createStudentColumns = ({
  onEdit,
  onDelete,
}: StudentColumnsProps): ColumnDef<Student>[] => [
  {
    accessorKey: "user.name",
    id: "name",
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
      const student = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{student.user.name}</span>
          {student.classroom && (
            <Badge variant="default" className="w-fit mt-1">
              {student.classroom.name}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "rollNumber",
    header: "Roll No.",
    cell: ({ row }) => {
      return <span className="font-mono">{row.getValue("rollNumber")}</span>;
    },
  },
  {
    accessorKey: "admissionNumber",
    header: "Admission No.",
    cell: ({ row }) => {
      return (
        <span className="font-mono">{row.getValue("admissionNumber")}</span>
      );
    },
  },
  {
    accessorKey: "user.email",
    id: "email",
    header: "Email",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          {student.user.email}
        </div>
      );
    },
  },
  {
    accessorKey: "user.phone",
    id: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const student = row.original;
      return student.user.phone ? (
        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          {student.user.phone}
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => {
      return (
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          {new Date(row.getValue("dateOfBirth")).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "bloodGroup",
    header: "Blood Group",
    cell: ({ row }) => {
      const bloodGroup = row.getValue("bloodGroup") as string | null;
      return bloodGroup ? (
        <Badge variant="outline">{bloodGroup}</Badge>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="rounded-xl"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(student)}
            className="rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
