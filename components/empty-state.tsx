export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card px-5 py-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
    </div>
  );
}
