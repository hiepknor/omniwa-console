import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GroupTargetEligibility, GroupTargetIdentity, ProjectedMemberCount } from './GroupTargetCells';

describe('Group List target cells', () => {
  it('shows projected group identity and type without expanding members', () => {
    const html = renderToStaticMarkup(<GroupTargetIdentity id="120363001@g.us" name="Operations" type="subgroup" />);
    expect(html).toContain('Operations');
    expect(html).toContain('120363001@g.us');
    expect(html).toContain('Subgroup');
    expect(html).toContain('[overflow-wrap:anywhere]');
    expect(html).not.toContain('truncate');
  });

  it('keeps missing member count unreported instead of manufacturing zero', () => {
    expect(renderToStaticMarkup(<ProjectedMemberCount count={1_284} />)).toContain('1,284');
    expect(renderToStaticMarkup(<ProjectedMemberCount />)).toContain('—');
  });

  it('wraps an eligibility reason below the short operational status', () => {
    const html = renderToStaticMarkup(<GroupTargetEligibility label="Unavailable" tone="failed" reason="send_permission_denied" />);
    expect(html).toContain('Unavailable');
    expect(html).toContain('Send permission denied');
    expect(html).not.toContain('max-w-44');
    expect(html).toContain('break-words');
    expect(html).toContain('leading-4');
  });
});
