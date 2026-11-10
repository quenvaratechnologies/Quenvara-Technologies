"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, Underline } from "lucide-react";

/**
 * Dependency-free rich text editor (contentEditable). The HTML it produces is UNTRUSTED:
 * the server sanitises with an allow-list on save, and again on public render.
 */
export function RichEditor({ name, defaultValue, label, invalid, describedBy }: { name: string; defaultValue: string; label: string; invalid?: boolean; describedBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [, force] = useState(0);

  useEffect(() => { if (ref.current) ref.current.innerHTML = defaultValue || ""; if (hidden.current) hidden.current.value = defaultValue || ""; }, [defaultValue]);

  const sync = () => { if (hidden.current && ref.current) hidden.current.value = ref.current.innerHTML; };
  const exec = (cmd: string, arg?: string) => { ref.current?.focus(); document.execCommand(cmd, false, arg); sync(); force((n) => n + 1); };
  const act = (cmd: string, arg?: string) => {
    if (cmd === "link") { const url = window.prompt("Link URL (https://…)"); if (url && /^(https?:\/\/|mailto:|\/)/i.test(url)) exec("createLink", url); return; }
    if (cmd === "image") { const url = window.prompt("Image URL (https://…). Use the Media library to upload."); if (url && /^https?:\/\//i.test(url)) exec("insertImage", url); return; }
    exec(cmd, arg);
  };
  const btn = "rounded p-1.5 hover:bg-surface-alt focus-visible:outline-2";
  const tools: [string, React.ReactNode, string, string?][] = [
    ["Heading 2", <Heading2 key="h2" className="h-4 w-4" />, "formatBlock", "h2"],
    ["Heading 3", <Heading3 key="h3" className="h-4 w-4" />, "formatBlock", "h3"],
    ["Bold", <Bold key="b" className="h-4 w-4" />, "bold"],
    ["Italic", <Italic key="i" className="h-4 w-4" />, "italic"],
    ["Underline", <Underline key="u" className="h-4 w-4" />, "underline"],
    ["Bulleted list", <List key="ul" className="h-4 w-4" />, "insertUnorderedList"],
    ["Numbered list", <ListOrdered key="ol" className="h-4 w-4" />, "insertOrderedList"],
    ["Quote", <Quote key="q" className="h-4 w-4" />, "formatBlock", "blockquote"],
    ["Code block", <Code key="c" className="h-4 w-4" />, "formatBlock", "pre"],
    ["Link", <LinkIcon key="l" className="h-4 w-4" />, "link"],
    ["Image", <ImageIcon key="img" className="h-4 w-4" />, "image"],
  ];
  return (
    <div className={`rounded-lg border bg-surface ${invalid ? "border-danger" : "border-line"}`}>
      <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap gap-0.5 border-b border-line p-1.5">
        {tools.map(([t, icon, cmd, arg]) => <button key={t} type="button" title={t} aria-label={t} onClick={() => act(cmd, arg)} className={btn}>{icon}</button>)}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} aria-invalid={invalid} aria-describedby={describedBy} onInput={sync} onBlur={sync} className="prose-av min-h-48 max-w-none p-4 outline-none" />
      <input ref={hidden} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
