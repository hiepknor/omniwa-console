import { useEffect } from 'react';

const PRODUCT_NAME = 'OmniWA Console';

export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${PRODUCT_NAME} — ${page}` : PRODUCT_NAME;
    return () => {
      document.title = PRODUCT_NAME;
    };
  }, [page]);
}
