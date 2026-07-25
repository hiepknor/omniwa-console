import { Button, Field, StateNotice, Status, Surface, UiV2Boundary } from '@/components/v2';
import { useDocumentTitle } from '@/components/useDocumentTitle';
import type { UiState } from '@/components/v2/state-model';
import type { ConsoleSession } from '@/lib/session';
import { useConnectFlow } from './connect-flow';

type ConnectNotice = 'session-invalid' | undefined;

export function connectFailureState(category: string): UiState {
  if (category === 'authentication' || category === 'authorization') {
    return { axis: 'transport', state: 'authentication-failed' };
  }
  if (category === 'network' || category === 'timeout') {
    return { axis: 'transport', state: 'unreachable' };
  }
  return { axis: 'resource', state: 'refresh-failed' };
}

export function ConnectPageV2({
  notice,
  onConnected,
}: {
  notice?: ConnectNotice;
  onConnected: (session: ConsoleSession) => void;
}) {
  useDocumentTitle('Connect');
  const flow = useConnectFlow(onConnected);
  const steps = [
    { id: 'origin', label: 'Validate origin', state: flow.pending ? 'complete' : 'idle' },
    {
      id: 'key',
      label: 'Verify key',
      state:
        flow.probeStage === 'verify-key'
          ? 'active'
          : flow.probeStage === 'detect-scope'
            ? 'complete'
            : 'idle',
    },
    {
      id: 'scope',
      label: 'Detect scope',
      state: flow.probeStage === 'detect-scope' ? 'active' : 'idle',
    },
  ] as const;

  return (
    <UiV2Boundary className="ui-v2-connect">
      <header className="ui-v2-connect__masthead">
        <a className="ui-v2-brand" href="/connect" aria-label="OmniWA Console connect">
          <span aria-hidden="true">OW</span>
          <strong>OmniWA Console</strong>
        </a>
        <Status tone="neutral">No active session</Status>
      </header>
      <main className="ui-v2-connect__main">
        <section className="ui-v2-connect__intro" aria-labelledby="ui-v2-connect-title">
          <span className="ui-v2-eyebrow">Self-hosted platform access</span>
          <h1 id="ui-v2-connect-title">Connect to an OmniWA runtime.</h1>
          <p>
            Enter the API origin and one runtime credential. Console validates the origin,
            verifies the key, and identifies its contract scope before opening the workspace.
          </p>
          <dl className="ui-v2-connect__facts">
            <div>
              <dt>Transport</dt>
              <dd>Direct browser → OmniWA GO</dd>
            </div>
            <div>
              <dt>Credential</dt>
              <dd>Memory only; cleared on reload or sign-out</dd>
            </div>
            <div>
              <dt>Default local API</dt>
              <dd className="ui-v2-mono">http://localhost:4000</dd>
            </div>
          </dl>
        </section>

        <div className="ui-v2-connect__form-column">
          {notice === 'session-invalid' ? (
            <StateNotice
              value={{ axis: 'session', state: 'invalid' }}
              detail="Enter a valid API key to reconnect. The previous credential has already been cleared from memory."
            />
          ) : null}
          <Surface
            title="Connection details"
            description="Origin and credential are validated directly against the selected runtime."
          >
            <form className="ui-v2-connect__form" onSubmit={flow.submit}>
              <ol className="ui-v2-connect__steps" aria-label="Connection checks">
                {steps.map((step, index) => (
                  <li
                    key={step.id}
                    data-state={step.state}
                    aria-current={step.state === 'active' ? 'step' : undefined}
                    aria-label={`${step.label}, ${step.state}`}
                  >
                    <span className="ui-v2-mono">0{index + 1}</span>
                    <strong>{step.label}</strong>
                  </li>
                ))}
              </ol>

              <Field
                ref={flow.baseUrlInput}
                id="ui-v2-connect-origin"
                name="baseUrl"
                type="url"
                label="API origin"
                hint="Enter the OmniWA GO origin directly; do not include a path, query, credential, or fragment."
                error={flow.baseUrlError?.message}
                value={flow.baseUrl}
                required
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={flow.pending}
                onChange={(event) => flow.setBaseUrl(event.target.value)}
              />

              <label className="ui-v2-field" htmlFor="ui-v2-connect-key">
                <span className="ui-v2-field__label">API key</span>
                <span className="ui-v2-secret-control">
                  <input
                    ref={flow.apiKeyInput}
                    className="ui-v2-input"
                    id="ui-v2-connect-key"
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
                    aria-describedby="ui-v2-connect-key-hint"
                    onChange={(event) => flow.setApiKey(event.target.value)}
                  />
                  <Button
                    className="ui-v2-secret-toggle"
                    type="button"
                    disabled={flow.pending}
                    aria-controls="ui-v2-connect-key"
                    aria-pressed={flow.showApiKey}
                    onClick={() => {
                      flow.setShowApiKey((shown) => !shown);
                      flow.apiKeyInput.current?.focus();
                    }}
                  >
                    {flow.showApiKey ? 'Hide' : 'Show'}
                  </Button>
                </span>
                <span className="ui-v2-field__hint" id="ui-v2-connect-key-hint">
                  Never persisted to browser storage, URLs, query keys, logs, or diagnostics.
                </span>
              </label>

              <div className="ui-v2-connect__credential-note">
                <Status tone="neutral">Memory-only credential</Status>
                <p>Reload and sign-out destroy the active key. Password autocomplete is disabled.</p>
              </div>

              {flow.connectionError ? (
                <StateNotice
                  value={connectFailureState(flow.connectionError.category)}
                  detail={flow.connectionError.detail ?? flow.connectionError.message}
                  requestId={flow.connectionError.requestId}
                />
              ) : null}

              <Button
                className="ui-v2-connect__submit"
                variant="primary"
                type="submit"
                disabled={!flow.canSubmit}
                aria-busy={flow.pending || undefined}
              >
                {flow.pending ? 'Connecting…' : 'Connect to OmniWA GO'}
              </Button>
            </form>
          </Surface>
        </div>
      </main>
    </UiV2Boundary>
  );
}
