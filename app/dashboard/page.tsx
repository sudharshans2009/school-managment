"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Welcome to Your Dashboard</CardTitle>
            <CardDescription>
              You are successfully authenticated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    User Information
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                      <dd className="text-sm mt-1">
                        {session.user?.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                      <dd className="text-sm mt-1">
                        {session.user?.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                      <dd className="text-sm font-mono mt-1 break-all">
                        {session.user?.id}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Session Info</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                      <dd className="text-sm mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Session ID</dt>
                      <dd className="text-sm font-mono mt-1 break-all">
                        {session.session?.id}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-xl shadow-sm bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h4 className="font-semibold text-sm mb-2">
                  🎉 Authentication Setup Complete!
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your Better Auth integration is working correctly. You can now build:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Admin Dashboard</li>
                  <li>Teacher Portal</li>
                  <li>Student Portal</li>
                  <li>Smartboard Display</li>
                  <li>API Routes with authentication</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
