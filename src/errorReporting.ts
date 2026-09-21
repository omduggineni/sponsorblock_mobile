// A single place to catch bugs in *our own* code and make them visible to
// the person using the script, instead of failing silently. We deliberately
// don't use a global window.onerror/unhandledrejection listener here: on a
// page as busy as YouTube's, that would also catch YouTube's own (frequent,
// unrelated) errors and alert the user about things we didn't cause. Instead
// every one of our own entry points — the main boot sequence, the per-frame
// tick loop, the navigation poller, and every UI event handler built via
// h() — routes through here, so we only ever report exceptions that
// actually originated in this script.

const SCRIPT_LABEL = 'SponsorBlock Mobile';
let hasAlerted = false;

export function reportError(context: string, error: unknown): void {
    console.error(`[${SCRIPT_LABEL}] Error in ${context}:`, error);

    // Alert at most once per page load. If something is broken badly enough
    // to throw repeatedly (e.g. every animation frame), stacking up modal
    // alert()s would freeze the tab far worse than the original bug.
    if (hasAlerted) return;
    hasAlerted = true;

    const message = error instanceof Error ? error.message : String(error);
    try {
        alert(
            `${SCRIPT_LABEL} hit an unexpected error (in ${context}) and may not work correctly on this page:\n\n${message}\n\nOpen the browser console for the full stack trace.`
        );
    } catch (e) {
        // alert() can be unavailable/throw in some embedded contexts; if so
        // the console.error above is all we can offer.
    }
}

// Wraps a function so a thrown error (sync or async) is reported instead of
// becoming a silent unhandled exception/rejection.
export function withErrorReporting<T extends (...args: any[]) => any>(context: string, fn: T): T {
    return ((...args: Parameters<T>) => {
        try {
            const result = fn(...args);
            if (result && typeof (result as any).then === 'function') {
                (result as Promise<unknown>).catch((error: unknown) => reportError(context, error));
            }
            return result;
        } catch (error) {
            reportError(context, error);
        }
    }) as T;
}
