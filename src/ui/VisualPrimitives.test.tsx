import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { Image } from './Image';
import { MetricGrid } from './MetricGrid';
import { Panel } from './Panel';
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

  it('owns panel body padding without conflicting utility overrides', () => {
    const defaultPanel = renderToStaticMarkup(<Panel>Default body</Panel>);
    const flushPanel = renderToStaticMarkup(<Panel bodyPadding="none">Flush body</Panel>);
    const compactPanel = renderToStaticMarkup(<Panel bodyPadding="compact-top">Compact body</Panel>);

    expect(defaultPanel).toContain('<div class="min-w-0 p-4">Default body</div>');
    expect(flushPanel).toContain('<div class="min-w-0">Flush body</div>');
    expect(flushPanel).not.toContain('p-4 p-0');
    expect(compactPanel).toContain('<div class="min-w-0 px-4 pb-4 pt-2">Compact body</div>');
  });

  it('keeps standalone, full-bleed, and compact metric geometry explicit', () => {
    const standalone = renderToStaticMarkup(<MetricGrid metrics={[{ label: 'Last fallback', value: 'Never observed' }]} />);
    const compactFlush = renderToStaticMarkup(<MetricGrid columns={6} density="compact" frame="flush" metrics={[{ label: 'Groups', value: '120' }]} />);
    const flushAfterContent = renderToStaticMarkup(<MetricGrid frame="flush-after-content" metrics={[{ label: 'Groups', value: '120' }]} />);

    expect(standalone).toContain('grid-cols-1');
    expect(standalone).toContain('border-t border-l');
    expect(standalone).toContain('break-words');
    expect(compactFlush).toContain('grid-cols-2');
    expect(compactFlush).toContain('sm:grid-cols-3');
    expect(compactFlush).toContain('lg:grid-cols-6');
    expect(compactFlush).not.toContain('border-t border-l');
    expect(flushAfterContent).toContain('<div class="grid border-line grid-cols-1 border-t sm:grid-cols-2 lg:grid-cols-4">');
  });
});
