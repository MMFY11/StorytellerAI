// lib/stories.ts
import pool from "@/lib/db";
import cleanTitle from "./cleanTitle";
import type { Page, Story } from "@/types/stories";

/**
 * Fetch all stories, with pages and images, for all users
 */
export async function getAllStories(): Promise<Story[]> {
  const [storyRows]: any = await pool.query(
    `SELECT id, name
       FROM stories
    ORDER BY id DESC`
  );

  const results: Story[] = [];
  for (const { id, name } of storyRows) {
    const [pageRows]: any = await pool.query(
      `SELECT p.page_number, p.text, i.url
         FROM pages p
         LEFT JOIN images i ON i.page_id = p.id
        WHERE p.story_id = ?
     ORDER BY p.page_number`,
      [id]
    );

    const pages: Page[] = pageRows.map((r: any) => ({
      txt: r.text,
      png: r.url,
    }));

    results.push({
      id,
      slug: cleanTitle(name),
      title: name,
      pages,
    });
  }
  return results;
}

/**
 * Fetch a single story by its slug
 */
export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const stories = await getAllStories();
  return stories.find((s) => s.slug === slug) || null;
}

/**
 * Fetch stories created by a specific user
 */
export async function getStoriesByUser(userId: string): Promise<Story[]> {
  const [storyRows]: any = await pool.query(
    `SELECT id, name
       FROM stories
      WHERE user_id = ?
   ORDER BY id DESC`,
    [userId]
  );

  const results: Story[] = [];
  for (const { id, name } of storyRows) {
    const [pageRows]: any = await pool.query(
      `SELECT p.page_number, p.text, i.url
         FROM pages p
         LEFT JOIN images i ON i.page_id = p.id
        WHERE p.story_id = ?
     ORDER BY p.page_number`,
      [id]
    );

    const pages: Page[] = pageRows.map((r: any) => ({
      txt: r.text,
      png: r.url,
    }));

    results.push({
      id,
      slug: cleanTitle(name),
      title: name,
      pages,
    });
  }
  return results;
}
