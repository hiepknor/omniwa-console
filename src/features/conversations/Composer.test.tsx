import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { acknowledgementDetail, ComposerUnavailable } from './Composer';

describe('ComposerUnavailable', () => {
  it('renders one compact explanation without disabled send controls', () => {
    const html = renderToStaticMarkup(<ComposerUnavailable detail="No authoritative command target is available." />);

    expect(html).toContain('Sending unavailable');
    expect(html).toContain('No authoritative command target is available.');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Send text');
    expect(html).not.toContain('Image or media');
  });
});

describe('acknowledgementDetail', () => {
  it('keeps the selected Conversation explicit without claiming delivery', () => {
    const detail = acknowledgementDetail({ disposition: 'completed', data: { messageId: 'message-1', acknowledgedAt: '2026-07-31T12:00:00Z' } }, 'AP RM');

    expect(detail).toContain('Accepted for AP RM');
    expect(detail).toContain('provider acknowledgement');
    expect(detail).toContain('not WhatsApp delivery');
  });
});
