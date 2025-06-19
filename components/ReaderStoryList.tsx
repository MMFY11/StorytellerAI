"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import type { Story as StoryType } from "@/types/stories";

interface ReaderStoryListProps {
  stories: (StoryType & { creatorName: string })[];
}

export default function ReaderStoryList({ stories }: ReaderStoryListProps) {
  const [search, setSearch] = useState("");

  const filtered = stories.filter((s) =>
    s.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by creator's name…"
        className="w-full max-w-md px-3 py-2 border rounded"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {filtered.map((story) => {
          const firstPage = story.pages[0];
          if (!firstPage?.png) return null;

          return (
            <Link
              key={story.slug}
              href={`/stories/${encodeURIComponent(story.slug)}`}
              className="border rounded-lg hover:shadow-lg transition"
            >
              <div className="relative">
                <p className="absolute top-0 right-0 bg-white text-purple-500 font-bold p-2 rounded text-sm flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {story.pages.length} Page
                  {story.pages.length > 1 && "s"}
                </p>
                <Image
                  src={firstPage.png}
                  alt={story.title}
                  width={500}
                  height={500}
                  className="w-full object-cover rounded-t-lg"
                />
              </div>
              <h2 className="text-lg p-4 font-light text-center">
                {story.title}
              </h2>
              <p className="text-center text-sm text-gray-500 mb-4">
                By {story.creatorName}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
