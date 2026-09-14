export type CopyResult = "copied" | "unavailable" | "uncertain";

export type CopyEnvironment = {
  isSecureContext: boolean;
  writeText?: (text: string) => Promise<void>;
  fallback: (text: string) => boolean;
  setTimer: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
  timeoutMs?: number;
};

const CLIPBOARD_TIMEOUT_MS = 1000;

class ClipboardTimeoutError extends Error {}

/**
 * Copies text without reporting a definitive failure while an async Clipboard
 * API request could still complete. The optional environment keeps the
 * browser-only behavior testable with Node's built-in runner.
 */
export async function copyText(text: string, environment = browserEnvironment()): Promise<CopyResult> {
  if (environment.isSecureContext && environment.writeText) {
    try {
      await settleWithin(environment.writeText(text), environment.timeoutMs ?? CLIPBOARD_TIMEOUT_MS, environment);
      return "copied";
    } catch (error) {
      // A timed-out browser request cannot be cancelled and may yet copy.
      if (error instanceof ClipboardTimeoutError) return "uncertain";
      return environment.fallback(text) ? "copied" : "unavailable";
    }
  }
  return environment.fallback(text) ? "copied" : "unavailable";
}

function browserEnvironment(): CopyEnvironment {
  return {
    isSecureContext: window.isSecureContext,
    writeText: navigator.clipboard?.writeText?.bind(navigator.clipboard),
    fallback: copyWithTextarea,
    setTimer: window.setTimeout.bind(window),
    clearTimer: window.clearTimeout.bind(window),
  };
}

function settleWithin<T>(promise: Promise<T>, ms: number, environment: CopyEnvironment): Promise<T> {
  promise.catch(() => {}); // a late rejection must not surface as unhandled
  return new Promise<T>((resolve, reject) => {
    const timer = environment.setTimer(() => reject(new ClipboardTimeoutError("Clipboard write timed out")), ms);
    promise.then(resolve, reject).finally(() => environment.clearTimer(timer));
  });
}

/** Visible to tests; production callers use it only through copyText. */
export function copyWithTextarea(text: string, documentRef: Document = document): boolean {
  const previousFocus = documentRef.activeElement && "focus" in documentRef.activeElement ? documentRef.activeElement as HTMLElement : null;
  const controlSelection = getControlSelection(previousFocus);
  const selection = documentRef.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.tabIndex = -1;
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  documentRef.body.append(textarea);
  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return documentRef.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
    previousFocus?.focus({ preventScroll: true });
    restoreControlSelection(previousFocus, controlSelection);
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}

type ControlSelection = { start: number | null; end: number | null; direction: "forward" | "backward" | "none" | null };

function getControlSelection(element: HTMLElement | null): ControlSelection | null {
  if (!element || !("selectionStart" in element) || !("selectionEnd" in element)) return null;
  const control = element as HTMLInputElement | HTMLTextAreaElement;
  return { start: control.selectionStart, end: control.selectionEnd, direction: control.selectionDirection };
}

function restoreControlSelection(element: HTMLElement | null, selection: ControlSelection | null) {
  if (!element || !selection || !("setSelectionRange" in element)) return;
  (element as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
}
