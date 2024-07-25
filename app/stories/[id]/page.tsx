import { getAllStories, getStory } from "@/lib/stories";
import { notFound } from "next/navigation";
import Story from "@/components/Story";

interface StoryPageProps{
    params:{
        id: string;
    };

}

function StoryPage({params: {id}}:StoryPageProps ) {
//Explanation: the id is URL encoded so we need to decode it before using it to get the story this fixes the issue where the story is not found when the id contains special characters such as %20 for spaces. 
const decodedId = decodeURIComponent(id);

const story = getStory(decodedId);

if (!story) {
    return notFound();
}

return <Story story={story} />; 
}

export default StoryPage;

export async function generateStaticParams(){
   const stories = getAllStories();

   //Explanation: we need to return an array of objects with the id property set to the story id this will generate a static page for each story
    // Example:[{ id:"story-1" } , { id:"story-2" } , ...]
   const paths=stories.map((story) =>({
    id: story.story,
   }));

   return paths;
 
}