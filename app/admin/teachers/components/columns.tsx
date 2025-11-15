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
  MapPin,
  Eye,
} from "lucide-react";
import Link from "next/link";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean | null;
  teacherAssignments: Array<{
    classroom: { name: string; grade: string; section: string };
    subject: { name: string };
  }>;
}

interface TeacherColumnsProps {
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

export const createTeacherColumns = ({
  onEdit,
  onDelete,
}: TeacherColumnsProps): ColumnDef<Teacher>[] => [
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
      const teacher = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{teacher.name}</span>
          {teacher.isActive && (
            <Badge variant="default" className="w-fit mt-1">
              Active
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          {row.getValue("email")}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null;
      return phone ? (
        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          {phone}
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string | null;
      return address ? (
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          {address}
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    id: "assignments",
    header: "Assignments",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {teacher.teacherAssignments.length > 0 ? (
            teacher.teacherAssignments.slice(0, 2).map((assignment, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {assignment.classroom.name} - {assignment.subject.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No assignments</span>
          )}
          {teacher.teacherAssignments.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{teacher.teacherAssignments.length - 2} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex gap-2">
          <Link href={`/admin/teachers/${teacher.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onEdit(teacher)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(teacher)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
