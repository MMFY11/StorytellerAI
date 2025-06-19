// app/stories/page.tsx
import { Story } from "@/types/stories";
import { getAllStories, getStoriesByUser } from "@/lib/stories";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import connection from "@/lib/db";
import { RowDataPacket } from "mysql2";
import ReaderStoryList from "@/components/ReaderStoryList";

export const revalidate = 0;

type StoryWithCreator = Story & { creatorName: string };

export default async function StoriesPage() {
  // 1) Check session
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect("/auth/login?callbackUrl=/stories");
  }

  const userId = session.user!.id as string;
  const userRole = session.user!.role as string;
  const userName = session.user!.name ?? "Unknown author";

  // 2) Fetch stories based on role
  const stories: Story[] =
    userRole === "creator"
      ? await getStoriesByUser(userId)
      : await getAllStories();

  // 3) Handle empty
  if (stories.length === 0) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <p>
          {userRole === "creator"
            ? "You haven't created any stories yet."
            : "No stories available."}
        </p>
      </div>
    );
  }

  // 4) Attach creatorName to each story
  const storiesWithCreators: StoryWithCreator[] = await Promise.all(
    stories.map(async (story) => {
      if (userRole === "creator") {
        return { ...story, creatorName: userName };
      }

      const [rows] = await connection.query<
        (RowDataPacket & { creatorName: string })[]
      >(
        `SELECT u.name AS creatorName
         FROM stories s
         JOIN users u ON s.user_id = u.id
         WHERE s.name = ?`,
        [story.title]
      );

      const creatorName = rows[0]?.creatorName ?? "Unknown author";
      return { ...story, creatorName };
    })
  );

  // 5) Render: readers get the search list, creators get the plain grid
  return (
    <div className="p-10 max-w-7xl mx-auto">
      {userRole === "reader" ? (
        <ReaderStoryList stories={storiesWithCreators} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {storiesWithCreators.map((story) => {
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

                <p className="text-center text-sm text-gray-500 mb-4">
                  By {story.creatorName}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
