import Image from "next/image"
import logo from "@/images/logo.webp"
import Link from "next/link"
import ProtectedCreator from "@/components/ProtectedCreator"
import StoryWriter from "@/components/StoryWriter"

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left: View Stories */}
        <div className="relative bg-purple-500 flex flex-col space-y-5 justify-center items-center pb-10 min-h-[500px] overflow-hidden">
          <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover">
            <source src="/videos/story.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex flex-col items-center space-y-5 px-4">
            <Image src={logo} height={300} alt="logo" className="drop-shadow-lg" />
            <Link
              href="/stories"
              className="px-20 bg-purple-700 hover:bg-purple-800 p-10 text-xl shadow-lg transition-colors rounded text-white"
            >
              View Stories
            </Link>
          </div>
        </div>

        {/* Right: Protected Creator UI */}
        <ProtectedCreator>
          <StoryWriter />
        </ProtectedCreator>
      </section>
    </main>
  )
}
