import Sidebar from '@/components/layout/Sidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] h-full overflow-y-auto">{children}</main>
    </div>
  );
}
