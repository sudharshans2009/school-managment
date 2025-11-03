import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

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
    <div className="space-y-4">
      {/* Back button */}
      <Link href={backHref}>
        <Button variant="outline" size="sm" className="rounded-xl">
          ← {backLabel}
        </Button>
      </Link>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        </div>
        {children && (
          <div className="flex gap-2 w-full sm:w-auto">{children}</div>
        )}
      </div>
    </div>
  );
}
