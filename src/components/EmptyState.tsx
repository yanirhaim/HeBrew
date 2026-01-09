interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = "📭" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 text-7xl">{icon}</div>
      <h3 className="mb-3 text-xl font-extrabold text-feather-text">
        {title}
      </h3>
      <p className="max-w-xs text-base font-bold text-feather-text-light leading-relaxed">{description}</p>
    </div>
  );
}
