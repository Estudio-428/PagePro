import { redirect } from 'next/navigation';

interface DashboardEditorPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function DashboardEditorPage({ searchParams }: DashboardEditorPageProps) {
  const query = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
  });

  const qs = query.toString();
  redirect(qs ? `/editor?${qs}` : '/products');
}
