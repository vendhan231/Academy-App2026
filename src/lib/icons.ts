import type React from 'react';

/**
 * The single icon contract used across the app.
 *
 * Every icon is a Lucide glyph (or a custom sport glyph) rendered with the
 * same stroke width, so the icon set stays visually consistent.
 */
export type IconComponent = React.FC<{ className?: string; strokeWidth?: number }>;
