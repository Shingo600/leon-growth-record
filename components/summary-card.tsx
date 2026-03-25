type SummaryCardProps = {
  label: string;
  value: string;
  subValue?: string;
};

export function SummaryCard({ label, value, subValue }: SummaryCardProps) {
  return (
    <div className="card p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {subValue ? <p className="mt-2 text-sm text-ink/60">{subValue}</p> : null}
    </div>
  );
}
