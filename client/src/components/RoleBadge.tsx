import { Badge } from "@/components/ui/badge";
import { Shield, Users, GraduationCap, UserCircle } from "lucide-react";

type Role = 'admin' | 'sales_consultant' | 'trainer' | 'student';

const roleConfig = {
  admin: {
    label: 'Admin',
    color: 'bg-role-admin/10 text-role-admin border-role-admin/20',
    icon: Shield
  },
  sales_consultant: {
    label: 'Sales Consultant',
    color: 'bg-role-sales/10 text-role-sales border-role-sales/20',
    icon: Users
  },
  trainer: {
    label: 'Trainer',
    color: 'bg-role-trainer/10 text-role-trainer border-role-trainer/20',
    icon: GraduationCap
  },
  student: {
    label: 'Student',
    color: 'bg-role-student/10 text-role-student border-role-student/20',
    icon: UserCircle
  }
};

interface RoleBadgeProps {
  role: Role;
  showIcon?: boolean;
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} gap-1`} data-testid={`badge-role-${role}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
