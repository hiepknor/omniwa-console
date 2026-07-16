import { useParams } from 'react-router-dom';

/**
 * Placeholder for a panel that has not been implemented yet.
 * Each panel's scope and allowed operation IDs are defined in docs/PANELS.md;
 * implementations replace this stub milestone by milestone
 * (see docs/IMPLEMENTATION_PLAN.md).
 */
export function PanelStub({ panel }: { panel: string }) {
  const params = useParams();
  const scope = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

  return (
    <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
      <h2 className="text-base font-semibold capitalize">{panel}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Not implemented yet. See <code>docs/PANELS.md#{panel}</code>.
      </p>
      {scope && <p className="mt-1 text-xs text-zinc-500">{scope}</p>}
    </div>
  );
}
