import { EventForm } from "@/components/event-form";
import { PageHeader } from "@/components/page-header";

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="予定追加"
        description="散歩、病院、薬などの予定をかんたんに登録できます。"
      />
      <EventForm />
    </div>
  );
}
