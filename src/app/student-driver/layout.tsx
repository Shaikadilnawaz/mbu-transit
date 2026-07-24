import { RoleGuard } from '@/components/auth/role-guard';

export default function StudentDriverLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="student-driver">{children}</RoleGuard>;
}
