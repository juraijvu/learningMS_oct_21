import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, User, Phone, Mail, GraduationCap, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

interface WorkExperience {
  position: string;
  company: string;
  duration: string;
  description?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    education: (user?.education as Education[]) || [],
    workExperience: (user?.workExperience as WorkExperience[]) || [],
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let profileImageUrl = user?.profileImageUrl;
    
    if (profileImage) {
      try {
        const uploadResult = await uploadImageMutation.mutateAsync(profileImage);
        profileImageUrl = uploadResult.imageUrl;
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload profile image", variant: "destructive" });
        return;
      }
    }

    updateProfileMutation.mutate({
      ...formData,
      profileImageUrl,
    });
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "", description: "" }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { position: "", company: "", duration: "", description: "" }]
    }));
  };

  const removeWorkExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your personal information and professional details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    <AvatarImage src={imagePreview || user.profileImageUrl} />
                    <AvatarFallback className="text-2xl bg-blue-500 text-white">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">{user.firstName} {user.lastName}</h2>
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2 mt-3 text-blue-100">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2 mt-1 text-blue-100">
                      <Phone className="w-4 h-4" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <div className="ml-auto">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setImagePreview(null);
                          setProfileImage(null);
                        }}
                        variant="secondary"
                        className="bg-white text-blue-600 hover:bg-blue-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <GraduationCap className="w-5 h-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {formData.education.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No education details added yet</p>
              ) : (
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Degree/Qualification</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., Bachelor's in Computer Science"
                          />
                        </div>
                        <div>
                          <Label>Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., University of Technology"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>Year</Label>
                            <Input
                              value={edu.year}
                              onChange={(e) => updateEducation(index, 'year', e.target.value)}
                              disabled={!isEditing}
                              placeholder="e.g., 2020-2024"
                            />
                          </div>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              className="mt-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description (Optional)</Label>
                        <Textarea
                          value={edu.description || ""}
                          onChange={(e) => updateEducation(index, 'description', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Additional details about your education..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <Button
                  type="button"
                  onClick={addEducation}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {formData.workExperience.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No work experience added yet</p>
              ) : (
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Position</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., Software Developer"
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., Tech Solutions Inc."
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>Duration</Label>
                            <Input
                              value={exp.duration}
                              onChange={(e) => updateWorkExperience(index, 'duration', e.target.value)}
                              disabled={!isEditing}
                              placeholder="e.g., Jan 2020 - Present"
                            />
                          </div>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeWorkExperience(index)}
                              className="mt-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description (Optional)</Label>
                        <Textarea
                          value={exp.description || ""}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Describe your role and achievements..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <Button
                  type="button"
                  onClick={addWorkExperience}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Work Experience
                </Button>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}