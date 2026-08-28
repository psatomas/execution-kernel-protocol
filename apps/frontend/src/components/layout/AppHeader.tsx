"use client";

import { useAccount, useChainId } from "wagmi";
import { localAnvil } from "@execution-kernel-protocol/config";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Badge, Dot } from "@/components/ui/Badge";

/**
 * Network identity is always visible, connected or not -- a wallet-writing
 * app with no visible "which chain am I on" indicator was a real gap (a
 * wrong-network wallet would otherwise fail silently at execute time with
 * no earlier warning).
 */
function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return <Badge tone="neutral">{localAnvil.name} (not connected)</Badge>;
  }

  if (chainId !== localAnvil.id) {
    return <Badge tone="danger">Wrong network -- switch to {localAnvil.name}</Badge>;
  }

  return (
    <Badge tone="success">
      <Dot tone="success" />
      {localAnvil.name} · chain {chainId}
    </Badge>
  );
}

export function AppHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <span className="hidden font-mono text-xs uppercase tracking-wider text-faint sm:inline">
          Execution Kernel
        </span>
        <span className="hidden text-border sm:inline">/</span>
        <h1 className="text-sm font-semibold text-ink">Protocol Console</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* The console (this app) and the public website (apps/landing,
            served at exekpro.com/about) are separate deployments -- a
            plain external link, not a Next.js route. Secondary/plain-text
            styling deliberately, so it doesn't compete with the wallet
            controls that follow. */}
        <a
          href="https://exekpro.com/about"
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-muted transition-colors hover:text-ink"
        >
          About ↗
        </a>
        <NetworkBadge />
        <ConnectWallet />
      </div>
    </header>
  );
}
