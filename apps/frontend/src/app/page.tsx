import { AppHeader } from "@/components/layout/AppHeader";
import { ExecutionConsole } from "@/components/execution/ExecutionConsole";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <ExecutionConsole />
      </main>
    </div>
  );
}
