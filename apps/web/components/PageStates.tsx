"use client";

import { ReactNode } from "react";

interface Props {
  icon: string;
  heading: string;
  sub?: string;
  action?: ReactNode;
}

function StateShell({ icon, heading, sub, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="text-5xl">{icon}</span>
      <h2 className="text-lg font-semibold text-zinc-100">{heading}</h2>
      {sub && <p className="max-w-xs text-sm text-zinc-400">{sub}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet" }: { label?: string }) {
  return <StateShell icon="🎵" heading={label} sub="Check back soon or explore other artists." />;
}

export function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

export function OfflineState() {
  return (
    <StateShell
      icon="📡"
      heading="You're offline"
      sub="Reconnect to keep the music going."
      action={
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Retry
        </button>
      }
    />
  );
}

export function ErrorState({ message = "Something went wrong." }: { message?: string }) {
  return (
    <StateShell
      icon="⚠️"
      heading="Oops"
      sub={message}
      action={
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Try again
        </button>
      }
    />
  );
}
