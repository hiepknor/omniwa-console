import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { ConsoleSession } from '@/lib/session';
import { Button, DescriptionItem, DescriptionList, Field, Input, Logo, Status } from '@/ui';
import { cn } from '@/ui/cn';
import { useConnectFlow } from './connect-flow';

type ConnectNotice = 'session-invalid' | undefined;

function Notice({ title, detail, requestId }: { title: string; detail?: string; requestId?: string }) {
  return (
    <div className="border border-line-strong bg-elevated p-3 text-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden className="size-2 shrink-0 bg-fg" style={{ background: 'linear-gradient(45deg, transparent 42%, #fff 42% 58%, transparent 58%), #111' }} />
        <strong className="font-semibold text-fg">{title}</strong>
      </div>
      {detail ? <p className="mt-1 text-fg-2">{detail}</p> : null}
      {requestId ? <p className="mt-1 font-mono text-xs text-fg-3">requestId: {requestId}</p> : null}
    </div>
  );
}

export function ConnectPage({ notice, onConnected }: { notice?: ConnectNotice; onConnected: (session: ConsoleSession) => void }) {
  useDocumentTitle('Connect');
  const flow = useConnectFlow(onConnected);
  const steps = [
    { id: 'origin', label: 'Validate origin', active: flow.pending && !flow.probeStage },
    { id: 'key', label: 'Verify key', active: flow.probeStage === 'verify-key' },
    { id: 'scope', label: 'Detect scope', active: flow.probeStage === 'detect-scope' },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-line-strong">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 min-h-16 px-8 max-sm:px-4">
          <span className="flex items-center gap-3">
            <Logo />
            <strong className="text-[13px] font-semibold text-fg">OmniWA Console</strong>
          </span>
          <Status tone="neutral">No active session</Status>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-8 py-12 max-sm:px-4 max-sm:py-8">
        <div className="grid w-full max-w-5xl grid-cols-2 items-center gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <section className="grid gap-5 min-w-0 order-1 max-[900px]:order-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Self-hosted platform access</span>
          <h1 className="max-w-[14ch] text-4xl font-semibold leading-tight tracking-tight text-fg">Connect to an OmniWA runtime.</h1>
          <p className="max-w-[48ch] text-sm text-fg-2">
            Enter the API origin and one runtime credential. Console validates the origin, verifies the key, and identifies
            its contract scope before opening the workspace.
          </p>
          <DescriptionList className="gap-px border border-line-strong bg-line text-sm">
            {[
              ['Transport', 'Direct browser → OmniWA GO'],
              ['Probe timeout', '15 seconds'],
            ].map(([dt, dd]) => (
              <DescriptionItem key={dt} label={dt} className="border-0 bg-surface px-3 py-2">{dd}</DescriptionItem>
            ))}
          </DescriptionList>
        </section>

        <div className="grid gap-4 min-w-0 order-2 max-[900px]:order-1">
          {notice === 'session-invalid' ? (
            <Notice
              title="Session cleared"
              detail="Enter a valid API key to reconnect. The previous credential has already been cleared from memory."
            />
          ) : null}

          <div className="border border-line-strong bg-surface">
            <div className="p-4 border-b border-line">
              <h2 className="text-sm font-semibold text-fg">Connection details</h2>
              <p className="mt-1 text-xs text-fg-3">Origin and credential are validated directly against the selected runtime.</p>
            </div>
            <form className="grid gap-4 p-4" onSubmit={flow.submit}>
              <div className="grid gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Checks · run on connect</span>
                <ol className="grid grid-cols-3 border border-line" aria-label="Connection checks">
                  {steps.map((step, i) => (
                    <li
                      key={step.id}
                      aria-current={step.active ? 'step' : undefined}
                      className={cn(
                        'grid gap-0.5 p-2 border-r border-line last:border-r-0',
                        step.active ? 'bg-fg text-bg' : 'text-fg-3',
                      )}
                    >
                      <span className="font-mono text-[11px] opacity-70">0{i + 1}</span>
                      <strong className="text-[11px] font-medium">{step.label}</strong>
                    </li>
                  ))}
                </ol>
              </div>

              <Field label="API origin" error={flow.baseUrlError?.message}>
                {(id) => (
                  <Input
                    ref={flow.baseUrlInput}
                    id={id}
                    name="baseUrl"
                    type="url"
                    value={flow.baseUrl}
                    required
                    autoComplete="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={flow.pending}
                    aria-invalid={flow.baseUrlError ? true : undefined}
                    onChange={(e) => flow.setBaseUrl(e.target.value)}
                  />
                )}
              </Field>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="connect-api-key" className="text-[11px] font-medium uppercase tracking-wider text-fg-3">API key</label>
                  <button
                    type="button"
                    disabled={flow.pending}
                    aria-controls="connect-api-key"
                    aria-pressed={flow.showApiKey}
                    onClick={() => { flow.setShowApiKey((s) => !s); flow.apiKeyInput.current?.focus(); }}
                    className="text-[11px] font-medium text-fg-2 hover:text-fg underline underline-offset-2 disabled:opacity-40"
                  >
                    {flow.showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  ref={flow.apiKeyInput}
                  id="connect-api-key"
                  name="apiKey"
                  type={flow.showApiKey ? 'text' : 'password'}
                  value={flow.apiKey}
                  placeholder="Paste API key"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={flow.pending}
                  onChange={(e) => flow.setApiKey(e.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <Status tone="neutral">Memory-only credential</Status>
                <p className="text-xs text-fg-3">Reload and sign-out destroy the active key. Never persisted to storage, URLs, or logs.</p>
              </div>

              {flow.connectionError ? (
                <Notice
                  title={flow.connectionError.message}
                  detail={flow.connectionError.detail}
                  requestId={flow.connectionError.requestId}
                />
              ) : null}

              <Button variant="primary" type="submit" disabled={!flow.canSubmit} aria-busy={flow.pending || undefined} className="w-full">
                {flow.pending ? 'Connecting…' : 'Connect to OmniWA GO'}
              </Button>
            </form>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
