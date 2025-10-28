import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users, BookOpen, Calendar, Sparkles, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import myLogo from '../orbit-logo.png';

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
    } catch (error) {
      // Error is already handled by mutation's onError callback
      // This catch prevents the error from bubbling up to the runtime error overlay
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-16 text-center relative">
          {/* Logo and Branding */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-blue-200">
                <img src={myLogo} className="w-20 h-20 object-contain" alt="Orbit LMS Logo" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-6 mb-12">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              Orbit LMS
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 mb-4">
              Learning Management System
            </h2>
            <p className="text-lg md:text-xl text-blue-700 max-w-3xl mx-auto leading-relaxed">
              Comprehensive training center management for students, trainers, sales consultants, and administrators
            </p>
          </div>
          
          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Sign in to access your learning portal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Demo Credentials 
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <p className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Demo Credentials
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded-lg border border-blue-200">
                      <p className="font-medium text-blue-900">Admin</p>
                      <code className="text-blue-600 text-xs">admin / admin123</code>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-green-200">
                      <p className="font-medium text-green-900">Trainer</p>
                      <code className="text-green-600 text-xs">trainer1 / trainer123</code>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-purple-200">
                      <p className="font-medium text-purple-900">Sales</p>
                      <code className="text-purple-600 text-xs">sales1 / sales123</code>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-orange-200">
                      <p className="font-medium text-orange-900">Student</p>
                      <code className="text-orange-600 text-xs">student1 / student123</code>
                    </div>
                  </div>
                </div>
                */}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-blue-900 font-semibold">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                      data-testid="input-username"
                      {...register("username")}
                    />
                    {errors.username && (
                      <p className="text-sm text-red-600">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-900 font-semibold">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12"
                      data-testid="input-password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      "Sign In to Orbit LMS"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">Powerful Features</h3>
            <p className="text-lg text-blue-700 max-w-2xl mx-auto">
              Everything you need to manage your learning organization efficiently
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Multi-Role Access</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="text-blue-700 text-center">
                  Separate portals for students, trainers, sales consultants, and administrators with role-specific features
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Course Management</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="text-green-700 text-center">
                  Create comprehensive courses with modules, sub-points, PDF materials, and progress tracking
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center py-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="text-purple-700 text-center">
                  Weekly schedules for both online and offline sessions with automated notifications
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white text-center py-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="text-orange-700 text-center">
                  Real-time module completion, task submissions, and comprehensive student performance analytics
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center py-8 border-t border-blue-200">
          <p className="text-blue-600 font-medium">
            © 2024 Orbit LMS. Empowering education through technology.
          </p>
        </div>
      </div>
    </div>
  );
}
