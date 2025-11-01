# React Hook Forms with Server Actions Integration

This document explains how to use React Hook Forms with Next.js Server Actions and TanStack Query in the school management system.

## Overview

The new pattern replaces the old API route + manual form approach with:
- **Server Actions**: Type-safe server functions that can be called directly from components
- **React Hook Form**: Declarative form management with validation
- **Zod**: Type-safe schema validation
- **TanStack Query**: Client-side state management and caching

## Architecture

### 1. Server Actions (`app/actions/`)

Server actions are functions that run on the server and can be called from client components. They provide type safety and automatic data revalidation.

**Example: `app/actions/subjects.ts`**

```typescript
"use server";

import { db } from "@/database";
import { subjects } from "@/database/schema";
import { revalidatePath } from "next/cache";

export type SubjectFormData = {
  name: string;
  code: string;
  description?: string;
  applicableGrades?: string[];
  applicableSections?: string[];
};

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createSubject(data: SubjectFormData): Promise<ActionResult> {
  try {
    const { name, code, description, applicableGrades, applicableSections } = data;

    // Validation
    if (!name || !code) {
      return {
        success: false,
        error: "Name and code are required",
      };
    }

    // Database operation
    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
        code,
        description: description || null,
        applicableGrades: applicableGrades ? JSON.stringify(applicableGrades) : null,
        applicableSections: applicableSections ? JSON.stringify(applicableSections) : null,
      })
      .returning();

    // Revalidate the cache
    revalidatePath("/admin/subjects");

    return {
      success: true,
      data: newSubject,
    };
  } catch (error) {
    console.error("Error creating subject:", error);
    return {
      success: false,
      error: "Failed to create subject",
    };
  }
}
```

**Key Points:**
- Always use `"use server"` directive at the top of the file
- Return a consistent `ActionResult` type with `success`, `data`, and `error` fields
- Use `revalidatePath()` to invalidate cached data after mutations
- Handle errors gracefully and return user-friendly messages

### 2. Form Validation (`lib/validations.ts`)

Define Zod schemas for form validation:

```typescript
import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code is required"),
  description: z.string().optional(),
  applicableGrades: z.array(z.string()).optional(),
  applicableSections: z.array(z.string()).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
```

### 3. Form Components (`components/forms/`)

Create reusable form components using React Hook Form:

**Example: `components/forms/subject-form.tsx`**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubjectSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function SubjectForm({ initialData, onSubmit, isLoading }: SubjectFormProps) {
  const form = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      // ... other fields
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mathematics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... other fields */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
```

**Key Points:**
- Use `useForm` hook with `zodResolver` for automatic validation
- Use `FormField` component for each input field
- Handle loading states with the `isLoading` prop
- Make forms reusable by accepting `initialData` for editing

### 4. Page Components (Client Components)

Use TanStack Query to integrate server actions with client-side state:

**Example: `app/admin/subjects/page.tsx`**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubject, updateSubject, getSubjects } from "@/app/actions/subjects";
import { SubjectForm } from "@/components/forms/subject-form";
import { toast } from "sonner";

export default function SubjectsPage() {
  const queryClient = useQueryClient();

  // Fetch data
  const { data: subjectsResult, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subjects"] });
        toast.success("Subject created successfully");
      } else {
        toast.error(result.error || "Failed to create subject");
      }
    },
  });

  const handleCreate = async (data: SubjectFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div>
      <SubjectForm
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
      {/* ... display subjects */}
    </div>
  );
}
```

**Key Points:**
- Use `useQuery` for data fetching
- Use `useMutation` for data mutations (create, update, delete)
- Invalidate queries after successful mutations
- Use toast notifications for user feedback

## Migration Guide

### Converting from API Routes to Server Actions

**Old Pattern (API Route + fetch):**

```typescript
// app/api/subjects/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... database operation
  return NextResponse.json(newSubject);
}

// Component
const createMutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch("/api/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
});
```

**New Pattern (Server Action):**

```typescript
// app/actions/subjects.ts
"use server";
export async function createSubject(data: SubjectFormData) {
  // ... database operation
  return { success: true, data: newSubject };
}

// Component
const createMutation = useMutation({
  mutationFn: createSubject,
});
```

### Converting from Manual Forms to React Hook Form

**Old Pattern:**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  };
  createMutation.mutate(data);
};

return (
  <form onSubmit={handleSubmit}>
    <Input name="name" required />
    <Input name="code" required />
    <Button type="submit">Submit</Button>
  </form>
);
```

**New Pattern:**

```typescript
const form = useForm({
  resolver: zodResolver(createSubjectSchema),
  defaultValues: { name: "", code: "" },
});

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">Submit</Button>
    </form>
  </Form>
);
```

## Benefits

1. **Type Safety**: Server actions provide end-to-end type safety from client to database
2. **Better DX**: No need to manually handle request/response serialization
3. **Automatic Revalidation**: Use `revalidatePath()` for cache invalidation
4. **Form Validation**: Zod schemas provide runtime and compile-time validation
5. **Better Error Handling**: Consistent error handling across the application
6. **Code Reusability**: Form components can be reused across the app

## Best Practices

1. **Always validate input** in server actions, even if client-side validation exists
2. **Use consistent return types** (ActionResult) for all server actions
3. **Handle errors gracefully** and return user-friendly messages
4. **Invalidate queries** after mutations to keep UI in sync
5. **Use toast notifications** for user feedback
6. **Keep forms reusable** by accepting initialData and onSubmit props
7. **Use Zod schemas** for both client and server validation

## Example: Complete CRUD Implementation

See `app/admin/subjects/` for a complete example of:
- ✅ Server actions for all CRUD operations
- ✅ React Hook Form with Zod validation
- ✅ TanStack Query integration
- ✅ Toast notifications
- ✅ Error handling
- ✅ Loading states
- ✅ Reusable form component

## Next Steps

Apply this pattern to other modules:
- [ ] Classrooms
- [ ] Students
- [ ] Teachers
- [ ] Attendance
- [ ] Homework
- [ ] Exams
- [ ] Announcements
- [ ] Timetable
