import { describe, expect, it } from 'vitest';
import { isSupportedMediaUrl } from './MediaAttachDialog';

describe('media URL validation', () => {
  it.each([
    'https://example.com/photo.jpg',
    'http://localhost:8080/audio.ogg',
  ])('accepts an HTTP(S) URL: %s', (url) => {
    expect(isSupportedMediaUrl(url)).toBe(true);
  });

  it.each([
    '',
    'not-a-url',
    'ftp://example.com/file.pdf',
    'data:image/png;base64,AAAA',
    'https://operator:secret@example.com/photo.jpg',
  ])('rejects unsupported media input: %s', (url) => {
    expect(isSupportedMediaUrl(url)).toBe(false);
  });
});
