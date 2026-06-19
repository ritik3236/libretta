/** Solid white card used to wrap every admin table/list, so the whole admin
 *  surface is consistent (no bare tables floating on the page background). */
export function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-slate-200 bg-white px-3 ${className}`}
    >
      {children}
    </div>
  );
}
