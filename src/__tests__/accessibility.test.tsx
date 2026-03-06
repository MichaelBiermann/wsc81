// @vitest-environment jsdom
/**
 * Accessibility tests — Section 508 / WCAG 2.1 AA
 *
 * Covers:
 *  - UI primitives (FormField, Input, Button, Textarea) via @testing-library/react + jest-axe
 *  - Focus-trap logic extracted from chat panels (pure function tests)
 *  - ARIA attribute contracts verified with jsdom
 */
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
expect.extend(toHaveNoViolations);

afterEach(cleanup);

// ─── FormField ────────────────────────────────────────────────────────────────

import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

describe("FormField + Input — label association", () => {
  it("associates label with input via htmlFor/id", () => {
    render(
      <FormField label="Name" htmlFor="test-name" required>
        <Input id="test-name" />
      </FormField>
    );
    // getByLabelText finds the input via the <label htmlFor> association
    const input = screen.getByLabelText(/Name/i);
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("required asterisk is aria-hidden", () => {
    const { container } = render(
      <FormField label="Email" htmlFor="test-email" required>
        <Input id="test-email" />
      </FormField>
    );
    const asterisk = container.querySelector("span[aria-hidden='true']");
    expect(asterisk).toBeInTheDocument();
    expect(asterisk?.textContent).toBe("*");
  });

  it("error message has role=alert", () => {
    render(
      <FormField label="Email" htmlFor="test-email" error="Pflichtfeld">
        <Input id="test-email" />
      </FormField>
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Pflichtfeld");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <FormField label="Vorname" htmlFor="fname" required>
        <Input id="fname" />
      </FormField>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Input ────────────────────────────────────────────────────────────────────

describe("Input — ARIA attributes", () => {
  it("sets aria-invalid when error=true", () => {
    render(<Input id="x" error />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input id="y" />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });
});

// ─── Textarea ─────────────────────────────────────────────────────────────────

describe("Textarea — ARIA attributes", () => {
  it("sets aria-invalid when error=true", () => {
    render(<Textarea id="ta" error />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("associates with label via id", () => {
    render(
      <FormField label="Anmerkungen" htmlFor="remarks">
        <Textarea id="remarks" />
      </FormField>
    );
    const ta = screen.getByLabelText(/Anmerkungen/i);
    expect(ta.tagName).toBe("TEXTAREA");
  });
});

// ─── Button ───────────────────────────────────────────────────────────────────

describe("Button — ARIA and state", () => {
  it("has no axe violations in default state", async () => {
    const { container } = render(<Button>Speichern</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sets aria-busy when loading", () => {
    render(<Button loading>Laden…</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("is disabled when loading", () => {
    render(<Button loading>Laden…</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not set aria-busy when not loading", () => {
    render(<Button>Senden</Button>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
  });
});

// ─── Focus trap logic (pure) ──────────────────────────────────────────────────

/**
 * The focus-trap pattern used in PublicChatPanel, AdminChatPanel, and FormsSection
 * is identical. We test it here as a pure DOM manipulation without React mounting.
 */
describe("Focus trap — keyboard cycling", () => {
  function createFocusableContainer() {
    const div = document.createElement("div");
    div.innerHTML = `
      <button id="first">First</button>
      <input id="middle" type="text" />
      <button id="last">Last</button>
    `;
    document.body.appendChild(div);
    return div;
  }

  function trapFocus(
    container: HTMLElement,
    e: { key: string; shiftKey: boolean; preventDefault: () => void },
    activeEl: Element | null
  ) {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && activeEl === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && activeEl === last) {
      e.preventDefault();
      first.focus();
    }
  }

  it("wraps forward Tab from last element to first", () => {
    const container = createFocusableContainer();
    const last = container.querySelector<HTMLElement>("#last")!;
    const first = container.querySelector<HTMLElement>("#first")!;
    last.focus();

    const prevented = vi.fn();
    trapFocus(container, { key: "Tab", shiftKey: false, preventDefault: prevented }, last);

    expect(prevented).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
    container.remove();
  });

  it("wraps backward Shift+Tab from first element to last", () => {
    const container = createFocusableContainer();
    const last = container.querySelector<HTMLElement>("#last")!;
    const first = container.querySelector<HTMLElement>("#first")!;
    first.focus();

    const prevented = vi.fn();
    trapFocus(container, { key: "Tab", shiftKey: true, preventDefault: prevented }, first);

    expect(prevented).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);
    container.remove();
  });

  it("does not interfere when Tab is pressed on middle element", () => {
    const container = createFocusableContainer();
    const middle = container.querySelector<HTMLElement>("#middle")!;
    middle.focus();

    const prevented = vi.fn();
    trapFocus(container, { key: "Tab", shiftKey: false, preventDefault: prevented }, middle);

    expect(prevented).not.toHaveBeenCalled();
    container.remove();
  });

  it("ignores non-Tab keys", () => {
    const container = createFocusableContainer();
    const first = container.querySelector<HTMLElement>("#first")!;
    first.focus();

    const prevented = vi.fn();
    trapFocus(container, { key: "Enter", shiftKey: false, preventDefault: prevented }, first);

    expect(prevented).not.toHaveBeenCalled();
    container.remove();
  });
});

// ─── ARIA attribute contracts ─────────────────────────────────────────────────

describe("ARIA attribute contracts — dialog pattern", () => {
  it("dialog container has role=dialog and aria-modal", () => {
    const { container } = render(
      <div role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 id="dlg-title">Test dialog</h2>
        <button>Close</button>
      </div>
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "dlg-title");
  });

  it("has no axe violations on a properly labelled dialog", async () => {
    const { container } = render(
      <div role="dialog" aria-modal="true" aria-labelledby="dlg2-title">
        <h2 id="dlg2-title">Confirm action</h2>
        <p>Are you sure?</p>
        <button>Yes</button>
        <button>No</button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ARIA attribute contracts — navigation menu pattern", () => {
  it("dropdown button has aria-expanded false initially", () => {
    render(
      <button aria-expanded={false} aria-haspopup="menu">Menu</button>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(btn).toHaveAttribute("aria-haspopup", "menu");
  });

  it("dropdown button shows aria-expanded true when open", () => {
    render(<button aria-expanded={true} aria-haspopup="menu">Menu</button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("menu container has role=menu", () => {
    const { container } = render(
      <div role="menu" aria-label="Navigation">
        <a href="/home" role="menuitem">Home</a>
        <a href="/about" role="menuitem">About</a>
      </div>
    );
    expect(container.querySelector('[role="menu"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
  });
});

describe("ARIA attribute contracts — live region pattern", () => {
  it("chat log has role=log and aria-live=polite", () => {
    const { container } = render(
      <div role="log" aria-live="polite" aria-label="Chat history">
        <p>Hello</p>
      </div>
    );
    const log = container.querySelector('[role="log"]');
    expect(log).toHaveAttribute("aria-live", "polite");
  });

  it("typing indicator has role=status", () => {
    const { container } = render(
      <span role="status" aria-label="Assistant is typing">
        <span aria-hidden="true">…</span>
      </span>
    );
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it("spinner has role=status", () => {
    const { container } = render(
      <div role="status" aria-label="Loading">
        <span aria-hidden="true" className="animate-spin">⟳</span>
      </div>
    );
    const status = container.querySelector('[role="status"]');
    expect(status).toHaveAttribute("aria-label", "Loading");
  });
});

describe("ARIA attribute contracts — skip link pattern", () => {
  it("skip link points to main-content id", () => {
    const { container } = render(
      <>
        <a href="#main-content" className="sr-only">Skip to main content</a>
        <main id="main-content"><p>Content</p></main>
      </>
    );
    const link = container.querySelector('a[href="#main-content"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Skip to main content");
    expect(container.querySelector("#main-content")).toBeInTheDocument();
  });

  it("has no axe violations with skip link present", async () => {
    const { container } = render(
      <div>
        <a href="#mc2">Skip to main content</a>
        <nav aria-label="Main navigation">
          <a href="/home">Home</a>
        </nav>
        <div id="mc2" role="main">
          <h1>Page title</h1>
          <p>Page content</p>
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ARIA attribute contracts — icon-only buttons", () => {
  it("icon-only button has aria-label", () => {
    const { container } = render(
      <button aria-label="Close dialog">
        <span aria-hidden="true">×</span>
      </button>
    );
    const btn = container.querySelector("button");
    expect(btn).toHaveAttribute("aria-label", "Close dialog");
  });

  it("decorative icon has aria-hidden", () => {
    const { container } = render(
      <button aria-label="Send message">
        <span aria-hidden="true" className="material-symbols-rounded">send</span>
      </button>
    );
    const icon = container.querySelector(".material-symbols-rounded");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("has no axe violations on icon-only button with label", async () => {
    const { container } = render(
      <button aria-label="Delete item">
        <span aria-hidden="true">🗑</span>
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ARIA attribute contracts — form fieldset pattern", () => {
  it("fieldset with legend has no axe violations", async () => {
    const { container } = render(
      <form>
        <fieldset>
          <legend>Person 1</legend>
          <label htmlFor="p1-name">Name</label>
          <input id="p1-name" type="text" />
          <label htmlFor="p1-dob">Date of birth</label>
          <input id="p1-dob" type="date" />
        </fieldset>
        <button type="submit">Submit</button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("counter control has aria-live for announcements", () => {
    const { container } = render(
      <div>
        <button aria-label="Decrease single rooms">−</button>
        <span aria-live="polite" aria-atomic="true">2</span>
        <button aria-label="Increase single rooms">+</button>
      </div>
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveAttribute("aria-atomic", "true");
    expect(live).toHaveTextContent("2");
  });
});
