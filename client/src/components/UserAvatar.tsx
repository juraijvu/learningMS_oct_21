import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const getInitials = () => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={user.profileImageUrl || undefined} 
        alt={`${user.firstName} ${user.lastName}`}
        className="object-cover"
      />
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  );
}
