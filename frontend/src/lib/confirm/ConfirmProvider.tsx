"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

type BaseOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (delete, reject, etc.) instead of the neutral
   * default. */
  danger?: boolean;
};

type ConfirmOptions = BaseOptions;

type PromptOptions = BaseOptions & {
  placeholder?: string;
  /** If true, the confirm button stays disabled until non-blank text is entered — matches the
   * old `window.prompt` call sites that rejected an empty reason. */
  required?: boolean;
};

type DialogState =
  | ({ kind: "confirm" } & ConfirmOptions & { resolve: (value: boolean) => void })
  | ({ kind: "prompt" } & PromptOptions & { resolve: (value: string | null) => void });

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  promptText: (options: PromptOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/** App-wide dialog for sensitive actions (sign out, delete, reject, cancel, etc.) — call
 * `useConfirm()` for a plain yes/no and `usePromptText()` when a reason needs to be collected,
 * instead of the browser's native `window.confirm`/`window.prompt`, so every such interruption
 * looks and behaves the same. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ kind: "confirm", ...options, resolve });
    });
  }, []);

  const promptText = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setInputValue("");
      setState({ kind: "prompt", ...options, resolve });
    });
  }, []);

  function close() {
    setState(null);
    setInputValue("");
  }

  function handleCancel() {
    if (!state) return;
    if (state.kind === "confirm") state.resolve(false);
    else state.resolve(null);
    close();
  }

  function handleConfirm() {
    if (!state) return;
    if (state.kind === "confirm") {
      state.resolve(true);
    } else {
      if (state.required && !inputValue.trim()) return;
      state.resolve(inputValue.trim());
    }
    close();
  }

  const promptBlocked = state?.kind === "prompt" && state.required && !inputValue.trim();

  return (
    <ConfirmContext.Provider value={{ confirm, promptText }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-900">{state.title}</h2>
            {state.message && <p className="mt-2 text-sm text-slate-600">{state.message}</p>}
            {state.kind === "prompt" && (
              <textarea
                autoFocus
                rows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={state.placeholder}
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                {state.cancelLabel ?? t("confirmDialog.defaultCancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={promptBlocked}
                autoFocus={state.kind === "confirm"}
                className={
                  state.danger
                    ? "rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    : "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                }
              >
                {state.confirmLabel ?? t("confirmDialog.defaultConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

function useConfirmContext() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm/usePromptText must be used within a ConfirmProvider");
  }
  return ctx;
}

export function useConfirm() {
  return useConfirmContext().confirm;
}

export function usePromptText() {
  return useConfirmContext().promptText;
}
