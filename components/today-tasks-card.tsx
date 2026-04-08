type TodayTask = {
  label: string;
  remaining: number;
};

export function TodayTasksCard({ tasks }: { tasks: TodayTask[] }) {
  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="text-sm text-ink/60">今日やること</p>
        <h3 className="mt-1 text-xl font-semibold">あと少しで達成</h3>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-3xl bg-cream px-4 py-4 text-sm leading-6 text-ink/75">
          今日はぜんぶ達成！レオンえらい！
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.label} className="rounded-3xl bg-cream px-4 py-4">
              <p className="text-sm font-semibold">{task.label}</p>
              <p className="mt-1 text-sm text-ink/65">あと {task.remaining}分で今日の目標達成です。</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
