/** Splits an editable headline at its first sentence break so the rest can be styled as an accent. */
export function splitHeadline(h: string): [string, string] {
  const m = h.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
  return m ? [m[1], m[2]] : [h, ""];
}
