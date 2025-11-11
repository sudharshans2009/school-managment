"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";
import { useRoleRedirect } from "@/hooks/use-role-redirect";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function AuditLogsPage() {
  useRoleRedirect(["admin"]);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  // const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "50");
    if (searchQuery) params.append("search", searchQuery);
    if (actionFilter !== "all") params.append("action", actionFilter);
    if (resourceFilter !== "all") params.append("resource", resourceFilter);
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{
    logs: AuditLog[];
    pagination: PaginationInfo;
  }>({
    queryKey: [
      "audit-logs",
      page,
      searchQuery,
      actionFilter,
      resourceFilter,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/security/audit-logs?${buildQueryParams()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setResourceFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "default";
      case "update":
      case "edit":
        return "secondary";
      case "delete":
        return "destructive";
      case "view":
        return "outline";
      case "login":
      case "logout":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getResourceBadgeColor = (resource: string) => {
    const colors: Record<string, string> = {
      student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      teacher:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      classroom:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      attendance:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      exam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      homework:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      leave: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      user: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return colors[resource.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  const exportToCSV = () => {
    if (!logs.length) return;

    const headers = [
      "Timestamp",
      "User Email",
      "Role",
      "Action",
      "Resource",
      "Description",
      "IP Address",
    ];
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.userEmail || "N/A",
          log.userRole || "N/A",
          log.action,
          log.resource,
          `"${log.description?.replace(/"/g, '""') || "N/A"}"`,
          log.ipAddress || "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader
          icon={History}
          title="Audit History"
          description="View system audit logs and security events"
        >
          <Button onClick={exportToCSV} disabled={!logs.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </AdminHeader>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter work done records by date, class, subject, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search user or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Filter */}
              <div className="space-y-2">
                <Label>Resource</Label>
                <Select
                  value={resourceFilter}
                  onValueChange={setResourceFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Audit Logs
                {logs.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({logs.length} records)
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Failed to load audit logs. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">
                  Loading audit logs...
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No audit logs found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Resource
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {log.userEmail || "N/A"}
                              </div>
                              {log.userRole && (
                                <Badge variant="outline" className="text-xs">
                                  {log.userRole}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge
                              className={getResourceBadgeColor(log.resource)}
                            >
                              {log.resource}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm max-w-md">
                            <div
                              className="truncate"
                              title={log.description || ""}
                            >
                              {log.description || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {log.ipAddress || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination?.page || 1}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination?.hasMore}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
