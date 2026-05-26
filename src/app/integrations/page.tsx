import { AppShell } from "@/components/layout/AppShell"
import { PageHeader } from "@/components/layout/PageHeader"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"
import { FUTURE_INTEGRATIONS } from "@/lib/future-integrations"

export default function IntegrationsPage() {
  const byPhase: Record<string, typeof FUTURE_INTEGRATIONS> = {}
  for (const intg of FUTURE_INTEGRATIONS) {
    if (!byPhase[intg.phase]) byPhase[intg.phase] = []
    byPhase[intg.phase].push(intg)
  }

  return (
    <AppShell>
      <PageHeader
        title="Integrations"
        subtitle="Current status and roadmap for external data sources."
      />
      <div className="px-6 pb-24 lg:pb-8 space-y-6">
        <p className="text-xs text-zinc-600 leading-relaxed">
          v0.1 is local-first. No integrations are active yet.
          Each integration below is planned for a specific release phase.
        </p>

        {Object.entries(byPhase)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([phase, integrations]) => (
            <div key={phase}>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Phase {phase}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {integrations.map((intg) => (
                  <IntegrationCard key={intg.id} integration={intg} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </AppShell>
  )
}
