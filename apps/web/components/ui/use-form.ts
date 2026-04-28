"use client";

/**
 * CHORD-063 – Reusable form system with validation state and async submission.
 *
 * Provides a hook that standardises field errors, loading state, and
 * optimistic submission feedback across all web forms.
 */

import { useState, useCallback, FormEvent } from "react";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface FormState<T> {
  values: T;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => FieldErrors<T>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
  });

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((s) => ({ ...s, values: { ...s.values, [key]: value }, errors: { ...s.errors, [key]: undefined } }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const errors = validate ? validate(state.values) : {};
      if (Object.keys(errors).length) { setState((s) => ({ ...s, errors })); return; }
      setState((s) => ({ ...s, isSubmitting: true, submitError: null, submitSuccess: false }));
      try {
        await onSubmit(state.values);
        setState((s) => ({ ...s, isSubmitting: false, submitSuccess: true }));
      } catch (err) {
        setState((s) => ({ ...s, isSubmitting: false, submitError: (err as Error).message ?? "Submission failed" }));
      }
    },
    [state.values, validate, onSubmit],
  );

  return { ...state, setField, handleSubmit };
}
