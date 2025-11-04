import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Home, LogIn } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-500/10 p-3">
              <Lock className="h-10 w-10 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
          <CardDescription className="text-base">
            You need to be signed in to access this page. Please sign in to
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-7xl sm:text-8xl font-bold text-amber-500/20">
              401
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:flex-1">
              <Link href="/auth/signin">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
