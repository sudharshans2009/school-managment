"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Monitor, Key, Hash } from "lucide-react";

export default function SmartboardLoginPage() {
  const [classroomId, setClassroomId] = useState("");
  const [classroomKey, setClassroomKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify classroom credentials
      const response = await fetch("/api/smartboard/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId, classroomKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid credentials");
      }

      // Store credentials in sessionStorage
      sessionStorage.setItem("smartboard_classroom_id", classroomId);
      sessionStorage.setItem("smartboard_classroom_key", classroomKey);

      // Redirect to smartboard display
      router.push("/smartboard/display");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-linear-to-br from-blue-500 to-purple-600 p-4 rounded-2xl w-fit">
            <Monitor className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Smartboard Access</CardTitle>
          <CardDescription className="text-base">
            Enter your classroom credentials to access the smartboard display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classroomId" className="flex items-center text-sm font-medium">
                <Hash className="h-4 w-4 mr-2" />
                Classroom ID
              </Label>
              <Input
                id="classroomId"
                type="text"
                placeholder="e.g., 690a41f9-c191-4f87-8ccd-493aa4da4bff"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                required
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Unique identifier for your classroom
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroomKey" className="flex items-center text-sm font-medium">
                <Key className="h-4 w-4 mr-2" />
                Classroom Key
              </Label>
              <Input
                id="classroomKey"
                type="password"
                placeholder="e.g., key-10a-2025"
                value={classroomKey}
                onChange={(e) => setClassroomKey(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Security key provided by your administrator
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Access Smartboard"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">
              📋 Need your credentials?
            </p>
            <p className="text-xs text-blue-700">
              Contact your school administrator to get your Classroom ID and Key. 
              These credentials are displayed in the Classroom Management section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
