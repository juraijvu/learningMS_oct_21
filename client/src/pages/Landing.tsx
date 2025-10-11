import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users, BookOpen, Calendar } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-16 text-center">
          <div className="flex justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-4">
            Learning Management System
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Comprehensive training center management for students, trainers, sales consultants, and administrators
          </p>
          
          {/* Login Form */}
          <div className="mt-8 max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to access the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      data-testid="input-username"
                      {...register("username")}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      data-testid="input-password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 py-12">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Separate portals for students, trainers, sales consultants, and administrators with role-specific features
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 mb-4">
                <BookOpen className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle className="text-xl">Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create comprehensive courses with modules, sub-points, PDF materials, and progress tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 mb-4">
                <Calendar className="h-6 w-6 text-chart-3" />
              </div>
              <CardTitle className="text-xl">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Weekly schedules for both online and offline sessions with automated notifications
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 mb-4">
                <GraduationCap className="h-6 w-6 text-chart-4" />
              </div>
              <CardTitle className="text-xl">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time module completion, task submissions, and comprehensive student performance analytics
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
