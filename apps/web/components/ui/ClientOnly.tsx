'use client';

import { ReactNode, useEffect, useState } from 'react';

export interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component that prevents hydration mismatches by only rendering
 * children on the client side after hydration is complete.
 * 
 * This component renders nothing on the server and shows a fallback
 * during hydration to prevent server/client rendering differences.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps): JSX.Element | null {
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    setHasMounted(true);
  }, []);

  // During server-side rendering and initial hydration, show fallback
  if (!hasMounted) {
    return fallback as JSX.Element | null;
  }

  // After hydration is complete, render the actual children
  return <>{children}</>;
}