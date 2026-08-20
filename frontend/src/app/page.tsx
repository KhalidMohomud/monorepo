import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl items-center px-6 py-20 sm:py-28">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Restaurant operations
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
          Merhaba Order Desk
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600">
          Manage menu categories, menu availability, and restaurant table
          status from one focused workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/menu-items"
            className="rounded-lg bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800"
          >
            View menu
          </Link>
          <Link
            href="/tables"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            Manage tables
          </Link>
        </div>
      </div>
    </main>
  );
}
