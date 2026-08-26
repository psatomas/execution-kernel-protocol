export interface FlowStep {
  label: string;
  sublabel?: string;
}

/**
 * The one recurring visual motif on this site: intent -> candidates ->
 * simulation -> score -> execution, rendered as a horizontal chain of
 * labeled nodes with a slow, looping highlight sweeping left to right --
 * meant to read as "a pipeline actually processing something," not a
 * decorative animation. Respects prefers-reduced-motion globally (see
 * globals.css): the sweep still exists in markup but stops moving.
 */
export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div
      className="flex flex-wrap items-stretch gap-0 overflow-x-auto py-2"
      role="img"
      aria-label={`Execution pipeline: ${steps.map((s) => s.label).join(" leads to ")}`}
    >
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-stretch">
          <div className="relative flex min-w-[128px] flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3.5">
            <span
              aria-hidden="true"
              className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full bg-accent [animation:flow-pulse_5s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            <span className="pl-4 font-mono text-[0.72rem] uppercase tracking-wide text-ink">{step.label}</span>
            {step.sublabel && <span className="pl-4 text-[0.72rem] text-faint">{step.sublabel}</span>}
          </div>
          {i < steps.length - 1 && (
            <div aria-hidden="true" className="flex w-8 flex-none items-center justify-center text-faint sm:w-10">
              →
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes flow-pulse {
          0%, 100% { opacity: 0.35; box-shadow: 0 0 0 0 rgba(76,141,255,0); }
          15% { opacity: 1; box-shadow: 0 0 0 4px var(--accent-soft); }
          30% { opacity: 0.35; box-shadow: 0 0 0 0 rgba(76,141,255,0); }
        }
      `}</style>
    </div>
  );
}
