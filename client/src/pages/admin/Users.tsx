import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", email: "", firstName: "", lastName: "", role: "student" });
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest("/api/admin/users", { method: "POST", body: userData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ 
        title: "Success", 
        description: `User created successfully. Username: ${newUser.username}`,
        duration: 5000,
      });
      setIsDialogOpen(false);
      setNewUser({ username: "", password: "", email: "", firstName: "", lastName: "", role: "student" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">User Management</h1>
            <p className="text-blue-700 font-medium mt-2">Manage all system users and their roles</p>
          </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-create-user">
              <UserPlus className="mr-2 h-5 w-5" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system. The user can change their password later.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  data-testid="input-user-username"
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  data-testid="input-user-password"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  data-testid="input-user-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  data-testid="input-user-lastname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="sales_consultant">Sales Consultant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending}
                data-testid="button-submit-user"
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </div>
              All Users ({filteredUsers.length})
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-300" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 rounded-xl h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50 border-b border-blue-100">
                    <TableHead className="font-bold text-blue-900 py-4 px-6">User</TableHead>
                    <TableHead className="font-bold text-blue-900 py-4 px-6">Email</TableHead>
                    <TableHead className="font-bold text-blue-900 py-4 px-6">Role</TableHead>
                    <TableHead className="font-bold text-blue-900 py-4 px-6">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserPlus className="h-8 w-8 text-blue-500" />
                          </div>
                          <p className="text-blue-600 font-semibold">No users found</p>
                          <p className="text-blue-500 text-sm">Try adjusting your search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <TableRow key={user.id} className={`hover:bg-blue-50 transition-colors border-b border-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`} data-testid={`row-user-${user.id}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <UserAvatar user={user} className="h-12 w-12 border-2 border-blue-200" />
                            <div>
                              <p className="font-bold text-blue-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-blue-600">@{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <p className="font-medium text-blue-800">{user.email}</p>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <RoleBadge role={user.role as any} />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <p className="text-blue-600 font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
