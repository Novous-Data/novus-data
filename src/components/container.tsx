import clsx from 'clsx';
import type { ReactNode } from 'react';

type Width = 'page' | 'reading';

/**
 * The one place horizontal rhythm is defined. Every page wraps its content in
 * this, so the side gutter is guaranteed at every viewport width and there is
 * a single knob to turn if the measure ever needs changing.
 */
export function Container({
  children,
  width = 'page',
  className,
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'mx-auto w-full px-5 sm:px-8',
        width === 'page' ? 'max-w-page' : 'max-w-reading',
        className,
      )}
    >
      {children}
    </div>
  );
}
