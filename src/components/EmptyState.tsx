interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = "📭" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-6xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
