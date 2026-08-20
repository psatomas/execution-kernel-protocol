import { ConnectWallet } from "@/components/ConnectWallet";
import { IntentExplorer } from "@/components/IntentExplorer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Execution Kernel Protocol</h1>
        <ConnectWallet />
      </header>
      <IntentExplorer />
    </main>
  );
}
