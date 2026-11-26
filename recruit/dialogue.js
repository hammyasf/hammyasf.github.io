// Dialogue tree navigation: the click-to-pick lines, no model involved.
export function createDialogue(tree) {
  let stack = [tree.root];
  const node = () => ({ id: stack.at(-1), ...tree.nodes[stack.at(-1)] });
  return {
    current: node,
    choose(i) {
      const ch = node().choices?.[i];
      if (!ch) return { node: node() };
      if (ch.next) {
        if (ch.label === 'Back' && stack.length > 1 && stack.at(-2) === ch.next) stack.pop();
        else stack.push(ch.next);
      }
      return { card: ch.card, node: node() };
    },
    back() { if (stack.length > 1) stack.pop(); return node(); },
    reset() { stack = [tree.root]; return node(); },
  };
}
