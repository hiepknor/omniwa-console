import { StateNotice } from './interaction';

/**
 * Server command acknowledgement notice. Keeps the "acknowledged by the server"
 * phrasing consistent and pairs it with a domain caveat so acknowledgement is
 * never presented as provider delivery or completion.
 */
export function CommandAck({ action, note }: { action: string; note: string }) {
  return <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail={`${action} was acknowledged by the server. ${note}`} />;
}
