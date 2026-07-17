import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

describe("Sprint 4.7 — assistant compact header", () => {
  it("L. déclencheur compact dans le header", () => {
    const shell = readSrc("components/navigation/AppShell.tsx");
    expect(shell).toContain("ConversationHeaderTrigger");
    expect(shell).not.toContain("app-conversation-band");
  });

  it("M. aucun espace horizontal réservé sous le header", () => {
    const css = readSrc("styles/sprint40.css");
    expect(css).not.toContain("app-conversation-band");
    expect(css).toContain("padding-top: var(--header-height)");
  });

  it("N. clic ouvre le panneau", () => {
    const trigger = readSrc("components/conversation/FloatingConversationBar.tsx");
    expect(trigger).toContain("conversation-header-panel");
    expect(trigger).toContain('setOpen((value) => !value)');
  });

  it("O. clic extérieur ferme", () => {
    const trigger = readSrc("components/conversation/FloatingConversationBar.tsx");
    expect(trigger).toContain("handlePointerDown");
  });

  it("P. Échap ferme", () => {
    const trigger = readSrc("components/conversation/FloatingConversationBar.tsx");
    expect(trigger).toContain('event.key === "Escape"');
  });

  it("Q. panneau mobile utilisable", () => {
    const css = readSrc("index.css");
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*conversation-header-panel/);
  });

  it("R. aucun chevauchement permanent — pas de bande fixe", () => {
    const css = readSrc("styles/sprint40.css");
    expect(css).not.toContain("--conversation-bar-height");
  });
});
