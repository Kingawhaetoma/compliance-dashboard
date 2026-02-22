import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto bg-slate-50 p-8">{children}</main>
      </div>
    </div>
  );
}
