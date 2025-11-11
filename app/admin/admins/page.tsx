"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type Admin,
} from "@/actions/admin";

export default function AdminsPage() {
  const [open, setOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: admins, isLoading } = useQuery<Admin[]>({
    queryKey: ["admins"],
    queryFn: async () => {
      const data = await getAllAdmins();
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      address: string;
      password: string;
    }) => {
      const result = await createAdmin(data);
      if (!result.success) {
        throw new Error(result.error || "Failed to create admin");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin created successfully");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      phone?: string;
      address?: string;
      password?: string;
      isActive?: boolean;
    }) => {
      const { id, ...updateData } = data;
      const result = await updateAdmin(id, updateData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update admin");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin updated successfully");
      setEditingAdmin(null);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAdmin(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete admin");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin deleted successfully");
      setDeletingAdmin(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeletingAdmin(null);
    },
  });

  const toggleActiveStatus = (admin: Admin) => {
    updateMutation.mutate({
      id: admin.id,
      isActive: !admin.isActive,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      password: formData.get("password") as string,
    };

    if (editingAdmin) {
      // Don't include password if it's empty
      const updateData: {
        id: string;
        name: string;
        phone: string;
        address: string;
        password?: string;
      } = {
        id: editingAdmin.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredAdmins = admins?.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Management" description="Admin Portal">
        <div className="text-center">Loading admins...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Management" description="Admin Portal">
      <div className="space-y-4 sm:space-y-6">
        <AdminHeader
          icon={UserCog}
          title="Admin Management"
          description="Manage system administrators"
        >
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) setEditingAdmin(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAdmin ? "Edit Admin" : "Add New Admin"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingAdmin?.name}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingAdmin?.email}
                      required
                      disabled={!!editingAdmin}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={editingAdmin?.phone || ""}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password{" "}
                      {editingAdmin ? "(leave blank to keep current)" : "*"}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required={!editingAdmin}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingAdmin?.address || ""}
                    placeholder="Enter address"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingAdmin(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingAdmin ? "Update Admin" : "Create Admin"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </AdminHeader>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search admins by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warning about admin count */}
        {admins && admins.length <= 1 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: This is the only admin account. You cannot delete it to
              ensure system access is maintained.
            </AlertDescription>
          </Alert>
        )}

        {/* Admins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmins && filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <Card
                key={admin.id}
                className={`hover:shadow-lg transition-shadow ${
                  !admin.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{admin.name}</CardTitle>
                        {admin.id === session?.user?.id && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={admin.isActive ? "default" : "secondary"}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  {admin.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2 shrink-0" />
                      <span>{admin.phone}</span>
                    </div>
                  )}
                  {admin.address && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{admin.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAdmin(admin);
                        setOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActiveStatus(admin)}
                      disabled={admin.id === session?.user?.id}
                      className="flex-1"
                    >
                      {admin.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingAdmin(admin)}
                      disabled={
                        (admins?.length || 0) <= 1 ||
                        admin.id === session?.user?.id
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No admins found matching your search"
                    : "No admins found"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingAdmin}
          onOpenChange={(open) => !open && setDeletingAdmin(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the admin account for{" "}
                <strong>{deletingAdmin?.name}</strong>. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingAdmin(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingAdmin) {
                    deleteMutation.mutate(deletingAdmin.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
