import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Mail, ArrowLeft } from "lucide-react";
import { HomeLayout } from "@/components/layouts/home-layout";

export const metadata = {
  title: "Contributors - Amrita Vidyalayam, Ettimadai",
  description: "Meet the developers behind the School Management System",
};

const contributors = [
  {
    name: "Sudharshan S",
    github: "sudharshans2009",
    email: "mail@sudharshans.me",
    role: "Lead Developer",
  },
  {
    name: "Karthikeyan G",
    github: "karthikeyan006867",
    email: "admin@karthikeyang.tech",
    role: "Developer",
  },
];

export default function ContributorsPage() {
  return (
    <HomeLayout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contributors
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet the talented developers who built the Amrita Vidyalayam
              Management System
            </p>
          </div>

          {/* Contributors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {contributors.map((contributor) => (
              <Card
                key={contributor.github}
                className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
              >
                <CardHeader className="text-center pb-2">
                  {/* Avatar Circle */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-linear-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-primary-foreground">
                        {contributor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  </div>
                  {/* Name */}
                  <CardTitle className="text-2xl font-bold">
                    {contributor.name}
                  </CardTitle>
                  {/* Full Stack Developer */}
                  <p className="text-sm font-medium text-muted-foreground pt-1">
                    Full Stack Developer
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* GitHub Link */}
                  <Link
                    href={`https://github.com/${contributor.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Github className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        @{contributor.github}
                      </p>
                    </div>
                  </Link>

                  {/* Email Link */}
                  <Link
                    href={`mailto:${contributor.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {contributor.email}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <Link href="/">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
