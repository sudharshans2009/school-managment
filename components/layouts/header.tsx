"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LucideIcon } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children?: ReactNode; // For action buttons like "Create Classroom", "Add Student", etc.
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
}: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link href={backHref}>
            <Button variant="outline" className="rounded-xl h-12 -ml-2">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl shrink-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
