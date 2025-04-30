// app/stories/page.tsx
import { Story } from "@/types/stories";
import { getAllStories } from "@/lib/stories";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";

export const revalidate = 0;

// Make the page component async so you can await the DB call:
export default async function StoriesPage() {
  // Await the Promise<Story[]> here:
  const stories: Story[] = await getAllStories();

  if (stories.length === 0) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <p>No stories found.</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {stories.map((story) => {
          const firstPage = story.pages[0];
          if (!firstPage?.png) return null;
          return (
            <Link
              key={story.slug}
              href={`/stories/${encodeURIComponent(story.slug)}`}
              className="border rounded-lg cursor-pointer hover:shadow-lg hover:border-pink-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <div className="relative">
                <p className="absolute flex items-center top-0 right-0 bg-white text-purple-500 font-bold p-3 rounded-lg m-2 text-sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {story.pages.length === 1
                    ? "1 Page"
                    : `${story.pages.length} Pages`}
                </p>
                <Image
                  src={firstPage.png}
                  alt={story.title}
                  width={500}
                  height={500}
                  className="w-full object-cover rounded-t-lg"
                />
              </div>
              <h2 className="text-lg p-5 first-letter:text-3xl font-light text-center">
                {story.title}
              </h2>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
