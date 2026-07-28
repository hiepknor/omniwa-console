import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FileUpload } from './FileUpload';

describe('FileUpload', () => {
  it('renders the canonical empty chooser with linked field semantics', () => {
    const html = renderToStaticMarkup(
      <FileUpload
        label="Photo"
        description="JPEG or PNG."
        error="Choose an image."
        required
        accept="image/jpeg,image/png"
        onFileChange={vi.fn()}
      />,
    );

    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/jpeg,image/png"');
    expect(html).toContain('No file selected');
    expect(html).toContain('Choose file');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('required=""');
  });

  it('renders selected metadata and explicit replace and clear actions', () => {
    const html = renderToStaticMarkup(
      <FileUpload
        label="Photo"
        file={new File(['fixture'], 'group-photo.png', { type: 'image/png' })}
        onFileChange={vi.fn()}
      />,
    );

    expect(html).toContain('group-photo.png');
    expect(html).toContain('image/png · 7 B');
    expect(html).toContain('Replace');
    expect(html).toContain('Clear');
  });

  it('disables both the native control and visible action', () => {
    const html = renderToStaticMarkup(
      <FileUpload label="Photo" disabled onFileChange={vi.fn()} />,
    );

    expect(html).toContain('aria-disabled="true"');
    expect((html.match(/disabled=""/g) ?? []).length).toBe(1);
  });
});
