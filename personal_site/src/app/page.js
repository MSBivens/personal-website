import Image from "next/image";

import meImage from "../../public/images/me.jpeg";

export default function Home() {
  return (
    // <!-- Main container -->
    <div class="bg-white h-screen ">
      {/* <!-- Flex container for centering items --> */}
      <div class="flex flex-col items-center justify-center ">
        <div class="mb-8 space-y-3">
          <h1 class="text-3xl font-bold text-gray-800">Michael Bivens</h1>
          <h3 class="text-lg text-gray-500">
            Software ENGR Student | Podcaster | Writer
          </h3>
          <Image src={meImage} alt="Profile Image" className="mx-auto mb-4" />
          <p class="text-gray-500">
            I do a lot, that&apos;s become a motto now as I am always busy doing
            so many different things.
          </p>
          <p class="text-gray-500">
            I&apos;m a full time student again, pursuing a new bachelor&apos;s
            degree, this time in Software Engineering.
          </p>
          <p class="text-gray-500">
            I produce two podcasts, Alcove and Quest for 5.
          </p>
          <p class="text-gray-500">
            I&apos;m writing several short and long form stories that take place
            in my original fantasy world, Illorim
          </p>
          <p class="text-gray-500">
            I volunteer for my fraternity, working on my chapter&apos;s alumni
            board as the president.
          </p>
        </div>
      </div>
    </div>
  );
}
