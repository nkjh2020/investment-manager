import Navbar from './Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-safe">{children}</main>
    </div>
  );
}
