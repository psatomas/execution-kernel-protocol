/** EXEKPRO, with the K -- Kernel -- picked out in the accent color. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-mono font-semibold tracking-[0.02em] ${className}`}>
      EXE<span className="text-accent">K</span>PRO
    </span>
  );
}
