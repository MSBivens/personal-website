import Image from "next/image";
import meImage from "../../public/images/me.jpeg";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Michael Bivens</h1>
      <h2 className="text-gray-500">
        Software ENGR Student | Podcaster | Writer
      </h2>
      <Image src={meImage} alt="Profile Image" className="mx-auto mb-4" />
      <p>I do a lot.</p>
      <p>
        I&apos;m a full time student again, pursuing a new bachelor&apos;s
        degree, this time in Software Engineering.
      </p>
      <p>I currently produce and host two podcasts, Alcove and Quest for 5.</p>
      <p>
        I&apos;m writing several short and long form stories that take place in
        my original fantasy world, Illorim
      </p>
      <p>
        I volunteer for my fraternity, working on my chapter&apos;s alumni board
        as the Director of Development and the Webmaster.
      </p>
      <p>I also play Lorcana every weekend at my LGS.</p>
      <h3>Support These Projects:</h3>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.patreon.com/jelles">Jelle&apos;s Marble Runs</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.patreon.com/naddpod">Not Another D&D Podcast</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.patreon.com/morningsomewhere">
            Morning Somewhere
          </a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.patreon.com/TheRegulationPod">
            The Regulation Podcast
          </a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.patreon.com/100percenteat">100% Eat</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.youtube.com/@ImprovBroadway">ImprovBroadway</a>
        </li>
      </ul>
      <h3>Websites I love</h3>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://indiewebify.me/">IndieWebify.Me</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://indieweb.org/">IndieWeb</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://www.miniaturemarket.com/">Miniature Market</a>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <a href="https://iwanttobeavoiceactor.com/your-website/">
            I Want to Be a Voice Actor!
          </a>
        </li>
      </ul>
    </div>
  );
}
