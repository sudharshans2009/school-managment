"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubjectSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

type SubjectFormData = z.infer<typeof createSubjectSchema>;

interface SubjectFormProps {
  initialData?: SubjectFormData;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  isLoading?: boolean;
}

const availableGrades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const availableSections = ["A", "B", "C", "D", "E"];

export function SubjectForm({ initialData, onSubmit, isLoading }: SubjectFormProps) {
  const [allGrades, setAllGrades] = useState(
    !initialData?.applicableGrades || initialData.applicableGrades.length === 0
  );
  const [allSections, setAllSections] = useState(
    !initialData?.applicableSections || initialData.applicableSections.length === 0
  );

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      applicableGrades: initialData?.applicableGrades || [],
      applicableSections: initialData?.applicableSections || [],
    },
  });

  const handleSubmit = async (data: SubjectFormData) => {
    // If "all" is selected, send empty array
    const submitData = {
      ...data,
      applicableGrades: allGrades ? [] : data.applicableGrades,
      applicableSections: allSections ? [] : data.applicableSections,
    };
    await onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., MATH101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the subject"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Applicable Grades */}
        <FormField
          control={form.control}
          name="applicableGrades"
          render={() => (
            <FormItem>
              <FormLabel>Applicable Grades</FormLabel>
              <FormDescription>
                Select which grades this subject applies to (leave empty for all)
              </FormDescription>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allGrades"
                    checked={allGrades}
                    onCheckedChange={(checked) => {
                      setAllGrades(checked as boolean);
                      if (checked) {
                        form.setValue("applicableGrades", []);
                      }
                    }}
                  />
                  <Label htmlFor="allGrades" className="font-normal cursor-pointer">
                    All Grades
                  </Label>
                </div>
                {!allGrades && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {availableGrades.map((grade) => (
                      <FormField
                        key={grade}
                        control={form.control}
                        name="applicableGrades"
                        render={({ field }) => {
                          return (
                            <FormItem
                              className="flex flex-row items-start space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(grade)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), grade])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== grade)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Grade {grade}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Applicable Sections */}
        <FormField
          control={form.control}
          name="applicableSections"
          render={() => (
            <FormItem>
              <FormLabel>Applicable Sections</FormLabel>
              <FormDescription>
                Select which sections this subject applies to (leave empty for all)
              </FormDescription>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allSections"
                    checked={allSections}
                    onCheckedChange={(checked) => {
                      setAllSections(checked as boolean);
                      if (checked) {
                        form.setValue("applicableSections", []);
                      }
                    }}
                  />
                  <Label htmlFor="allSections" className="font-normal cursor-pointer">
                    All Sections
                  </Label>
                </div>
                {!allSections && (
                  <div className="flex gap-2 pt-2">
                    {availableSections.map((section) => (
                      <FormField
                        key={section}
                        control={form.control}
                        name="applicableSections"
                        render={({ field }) => {
                          return (
                            <FormItem
                              className="flex flex-row items-start space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(section)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), section])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== section)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {section}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update Subject" : "Create Subject"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
