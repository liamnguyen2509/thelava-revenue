import Header from "./header";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-20">
        <Sidebar />
        <main className="ml-64 flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
