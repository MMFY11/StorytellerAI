// types/stories.ts

export interface Page {
    txt: string;
    png: string;
  }
  
  export interface Story {
    id: number;         // Unique identifier from the database
    slug: string;       // URL-friendly title (cleanTitle(name))
    title: string;      // Human-readable story title
    pages: Page[];      // Array of page content + image URL
  }
  