export type UserRole = "user" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};
