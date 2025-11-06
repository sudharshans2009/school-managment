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
  Eye,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export interface Student {
  id: string;
  rollNumber: string;
  admissionNumber: string;
  house: "Amritamayi" | "Anandamayi" | "Chinmayi" | "Jothyrmayi" | null;
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
  onMedical: (student: Student) => void;
  onDisciplinary: (student: Student) => void;
}

export const createStudentColumns = ({
  onEdit,
  onDelete,
  onMedical,
  onDisciplinary,
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
    accessorKey: "house",
    header: "House",
    cell: ({ row }) => {
      const house = row.getValue("house") as string | null;
      if (!house) return <span className="text-gray-400">-</span>;
      
      const houseColors: Record<string, string> = {
        Amritamayi: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300",
        Anandamayi: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300",
        Chinmayi: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300",
        Jothyrmayi: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300",
      };
      
      return (
        <Badge className={houseColors[house]}>
          {house}
        </Badge>
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
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/students/${student.id}`}>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
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
            variant="outline"
            size="sm"
            onClick={() => onMedical(student)}
            className="rounded-xl text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
            title="Medical Records"
          >
            <HeartPulse className="h-4 w-4 mr-1" />
            Medical
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisciplinary(student)}
            className="rounded-xl text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50"
            title="Disciplinary Actions"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Disciplinary
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
