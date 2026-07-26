import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { Image } from './Image';
import { ProgressBar } from './ProgressBar';

describe('visual primitives', () => {
  it('renders only the canonical decorative icon geometry', () => {
    const html = renderToStaticMarkup(<Icon name="events" size="nav" />);
    expect(html).toContain('<svg');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('size-[18px]');
    expect(html).toContain('stroke-width="1.75"');
  });

  it('exposes determinate and indeterminate progress honestly', () => {
    const determinate = renderToStaticMarkup(<ProgressBar label="Replay" value={38} />);
    const indeterminate = renderToStaticMarkup(<ProgressBar label="Sync" />);
    const complete = renderToStaticMarkup(<ProgressBar label="Import" value={38} status="complete" />);
    expect(determinate).toContain('role="progressbar"');
    expect(determinate).toContain('aria-valuenow="38"');
    expect(determinate).toContain('aria-valuetext="38%"');
    expect(determinate).toContain('width:38%');
    expect(indeterminate).not.toContain('aria-valuenow');
    expect(indeterminate).toContain('aria-valuetext="In progress"');
    expect(complete).toContain('aria-valuenow="100"');
  });

  it('renders controlled image loading and accessible error fallback states', () => {
    const loading = renderToStaticMarkup(<Image src="/sample.svg" alt="Sample" state="loading" />);
    const failed = renderToStaticMarkup(<Image alt="Unavailable sample" state="error" />);
    expect(loading).toContain('<img');
    expect(loading).toContain('Loading image…');
    expect(failed).toContain('role="img"');
    expect(failed).toContain('aria-label="Unavailable sample"');
    expect(failed).toContain('Image unavailable');
  });
});
