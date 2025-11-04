import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { PageHeader } from "../layouts/header";

interface TeacherHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}

export function TeacherHeader({
  icon: Icon,
  title,
  description,
  backHref = "/teacher",
  backLabel = "Back",
  children,
}: TeacherHeaderProps) {
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
