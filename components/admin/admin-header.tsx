"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { PageHeader } from "../layouts/header";

interface AdminHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode; // For action buttons like "Create Classroom", "Add Student", etc.
}

export function AdminHeader({
  icon: Icon,
  title,
  description,
  backHref = "/admin",
  backLabel = "Back",
  children,
}: AdminHeaderProps) {
  return (
    <PageHeader
      icon={Icon}
      title={title}
      description={description}
      backHref={backHref}
      backLabel={backLabel}
    >
      {children}
    </PageHeader>
  );
}
