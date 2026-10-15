import { preprocessMarkdown, buildStencilFromIds } from "../src/lib/extraction/astPreprocessor";
import { applyStencilToMarkdown } from "../src/lib/extraction/stencil";

async function run() {
  const md = `%%%%
# Card Title\n
This is the front paragraph with **bold** and a list:\n
- item one\n- item two\n
> This is the answer blockquote with _italic_.\n
Some trailing notes.\n%%%%`;

  // Build preprocessor result from the cleaned chunk (markers are removed inside the helpers normally)
  const cleaned = String(md || "").replace(/^\s*%{4,}\s*$/gm, "").trim();
  const pre = preprocessMarkdown(cleaned);

  console.log("Parsed nodes (id:type:text snippet):");
  for (const n of pre.nodes) {
    console.log(`${n.id}: ${n.type}: ${String(n.text).slice(0,60).replace(/\n/g,' ')}...`);
  }

  // Pick a front node (first paragraph-like) and back node (blockquote)
  const frontNode = pre.nodes.find(n => (n.type === 'paragraph' || n.type === 'heading') && /front/i.test(n.text));
  const backNode = pre.nodes.find(n => n.type === 'blockquote' || /answer/i.test(n.text));

  if (!frontNode || !backNode) {
    console.error('Could not auto-select nodes for test');
    process.exit(1);
  }

  const stencil = buildStencilFromIds(pre.root, frontNode.id, backNode.id);
  console.log('\nUsing stencil:', stencil);

  const extracted = applyStencilToMarkdown(md, stencil);
  console.log('\n--- EXTRACTED FRONT ---\n', extracted.front);
  console.log('\n--- EXTRACTED BACK ---\n', extracted.back);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
