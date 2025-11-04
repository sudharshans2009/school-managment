import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { PageHeader } from "../layouts/header";

interface StudentHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}

export function StudentHeader({
  icon: Icon,
  title,
  description,
  backHref = "/student",
  backLabel = "Back",
  children,
}: StudentHeaderProps) {
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
