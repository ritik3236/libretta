import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getEntryDetail } from "@/server/queries/entry-detail";
import { AppHeader } from "@/components/nav/AppHeader";
import { EntryDetailClient } from "@/components/ledger/EntryDetailClient";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUser();
  const entry = await getEntryDetail(userId, id);
  if (!entry) notFound();
  // Archived entries are hidden from users — bounce back to the ledger.
  if (entry.status === "ARCHIVED") redirect(`/banks/${entry.customerId}`);

  return (
    <>
      <AppHeader title="Transaction" backHref={`/banks/${entry.customerId}`} />
      <div className="mx-auto max-w-lg px-5 pb-24 pt-4 md:pt-6">
        <EntryDetailClient entry={entry} />
      </div>
    </>
  );
}
