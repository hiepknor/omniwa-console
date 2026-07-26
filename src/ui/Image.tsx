import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export type ImageAspect = 'auto' | 'square' | 'video' | 'wide';
export type ImageFit = 'cover' | 'contain';
export type ImageState = 'auto' | 'loading' | 'error';

const aspects: Record<ImageAspect, string> = {
  auto: '',
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
};

/** Framed product image with deterministic loading/error treatment and optional caption. */
export function Image({
  alt,
  src,
  aspect = 'video',
  fit = 'cover',
  state = 'auto',
  caption,
  fallback,
  className,
  imageClassName,
  onLoad,
  onError,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src'> & {
  alt: string;
  src?: string;
  aspect?: ImageAspect;
  fit?: ImageFit;
  state?: ImageState;
  caption?: ReactNode;
  fallback?: ReactNode;
  imageClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const showError = state === 'error' || failed || !src;
  const showLoading = !showError && (state === 'loading' || (state === 'auto' && !loaded));

  return (
    <figure className={cn('grid min-w-0 gap-2', className)}>
      <div className={cn('relative grid min-w-0 place-items-center overflow-hidden border border-line-strong bg-recessed', aspects[aspect])}>
        {showError ? (
          <div role="img" aria-label={alt} className="grid min-h-24 place-items-center gap-1 p-4 text-center">
            {fallback ?? <><strong className="text-[11px] font-medium uppercase tracking-wider text-fg">Image unavailable</strong><span className="text-xs text-fg-3">No visual content was rendered.</span></>}
          </div>
        ) : (
          <>
            <img
              alt={alt}
              src={src}
              className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain', showLoading && 'invisible', imageClassName)}
              onLoad={(event) => { setLoaded(true); onLoad?.(event); }}
              onError={(event) => { setFailed(true); onError?.(event); }}
              {...props}
            />
            {showLoading ? <div role="status" className="absolute inset-0 grid place-items-center p-4 text-xs text-fg-3">Loading image…</div> : null}
          </>
        )}
      </div>
      {caption ? <figcaption className="text-xs text-fg-3">{caption}</figcaption> : null}
    </figure>
  );
}
