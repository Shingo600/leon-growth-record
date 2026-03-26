type InsightItem = {
  label: string;
  value: string;
};

export function BalanceInsightCard({
  items,
  comment
}: {
  items: InsightItem[];
  comment: string;
}) {
  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="text-sm text-ink/60">過不足の見える化</p>
        <h3 className="mt-1 text-xl font-semibold">今日のバランス</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-3xl bg-cream px-4 py-3">
            <p className="text-xs text-ink/55">{item.label}</p>
            <p className="mt-1 text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="rounded-3xl bg-white px-4 py-3 text-sm leading-6 text-ink/75 ring-1 ring-sand">
        {comment}
      </p>
    </section>
  );
}
