import type { IntentDefinition, ExecutionModuleInfo } from "@execution-kernel-protocol/types";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import type { ExecutionMetrics } from "@/hooks/useExecutionMetrics";

/**
 * Presentational only -- takes data already fetched by IntentExplorer's
 * queries rather than re-fetching, so selecting an intent doesn't trigger
 * two independent requests for the same registry reads.
 */
export function OverviewStats({
  intents,
  selectedModules,
  metrics,
}: {
  intents: readonly IntentDefinition[] | undefined;
  selectedModules: readonly ExecutionModuleInfo[] | undefined;
  metrics: ExecutionMetrics | undefined;
}) {
  const activeIntents = intents?.filter((i) => i.active).length ?? 0;

  return (
    <Panel title="Protocol overview" eyebrow="Live state">
      <div className="grid grid-cols-2 gap-4">
        <StatTile label="Registered intents" value={intents?.length ?? "--"} hint={`${activeIntents} active`} />
        <StatTile label="Candidate modules" value={selectedModules?.length ?? "--"} hint="for selected intent" />
        <StatTile
          label="Executions"
          value={metrics?.totalExecutions ?? "--"}
          hint="for selected intent"
        />
        <StatTile
          label="Modules that have won"
          value={metrics ? Object.keys(metrics.executionsByModule).length : "--"}
          hint="distinct winners"
        />
      </div>
    </Panel>
  );
}
