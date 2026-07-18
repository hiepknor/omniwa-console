import { ApiFailure } from '@/api/envelopes';

export type OverviewDiagnostic = {
  source: string;
  error: unknown;
};

function diagnosticDetail({ source, error }: OverviewDiagnostic) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const message = error instanceof Error ? error.message : 'Request failed';

  return {
    source,
    category: failure?.category ?? 'unknown',
    message,
    requestId: failure?.requestId,
    retryable: failure?.retryable ?? false,
  };
}

export function OverviewDiagnostics({
  id,
  diagnostics,
  onRetry,
}: {
  id: string;
  diagnostics: OverviewDiagnostic[];
  onRetry?: () => void;
}) {
  if (diagnostics.length === 0) return null;
  const details = diagnostics.map(diagnosticDetail);

  return (
    <section className="overview-diagnostics" aria-labelledby={id}>
      <div className="overview-diagnostics-head">
        <div>
          <span className="overview-eyebrow">Diagnostics</span>
          <h2 id={id}>
            {diagnostics.length} {diagnostics.length === 1 ? 'source needs review' : 'sources need review'}
          </h2>
        </div>
        {onRetry && details.some((detail) => detail.retryable) && (
          <button className="btn sm" type="button" onClick={onRetry}>Retry failed reads</button>
        )}
      </div>
      <div className="overview-diagnostic-list">
        {details.map((detail) => (
          <div className="overview-diagnostic-row" key={detail.source}>
            <strong>{detail.source}</strong>
            <span className="mono" title={detail.category}>{detail.category}</span>
            <span title={detail.message}>{detail.message}</span>
            <span className="mono" title={detail.requestId ?? 'Request ID unavailable'}>{detail.requestId ?? 'Request ID unavailable'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
