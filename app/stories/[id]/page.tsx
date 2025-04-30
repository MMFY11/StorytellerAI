// app/stories/[id]/page.tsx
import { notFound } from 'next/navigation';
import type { Story as StoryType } from '@/types/stories';
import { getStoryBySlug, getAllStories } from '@/lib/stories';
import Story from '@/components/Story';

interface Params {
  id: string;
}
interface Props {
  params: Params;
}

export default async function StoryPage({ params: { id: slug } }: Props) {
  const story: StoryType | null = await getStoryBySlug(slug);
  if (!story) return notFound();
  return <Story story={story} />;
}

export async function generateStaticParams() {
  const stories: StoryType[] = await getAllStories();
  return stories.map((s: StoryType) => ({
    id: s.slug,
  }));
}
