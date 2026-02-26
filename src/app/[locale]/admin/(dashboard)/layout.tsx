import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-8">{children}</div>
            </div>
        </div>
    );
}
