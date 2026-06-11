import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The MD3 type scale defines custom `text-*` font-size utilities (e.g.
// `text-label-md`, `text-title-lg`). Out of the box tailwind-merge can't tell
// these apart from `text-<color>` utilities (e.g. `text-on-primary`), so when
// both appear together it wrongly treats them as conflicting and drops the
// colour — leaving e.g. a primary button's label invisible. Registering the
// scale as font-sizes keeps the two groups distinct.
const FONT_SIZES = [
  "display-lg",
  "headline-lg",
  "headline-lg-mobile",
  "headline-md",
  "title-lg",
  "title-md",
  "body-lg",
  "body-md",
  "label-md",
  "label-sm",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

/** Merge Tailwind class lists, resolving conflicts (last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
