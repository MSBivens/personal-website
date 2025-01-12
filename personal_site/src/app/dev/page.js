export default function Dev() {
  return (
    <div>
      <h1>Developer Portfolio</h1>
      <p>
        You can download a PDF copy of my resume{" "}
        <a href="../../files/mbivens_resume.pdf">here</a>.
      </p>
      <p>
        After leaving Web3 behind, I&apos;m working on building a new portfolio
        of live projects. I&apos;ll have more shortly!
      </p>
      <h2>Select Projects</h2>
      {/* <h3>TBD</h3>
      <p>TBD</p>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a></a>
          </p>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a></a>
          </p>
        </li>
      </ul> */}
      {/* PEP Website */}
      <h3>Purple Elephant Productions Website</h3>
      <p>
        This website is for the umbrella that holds all of my content, including
        YouTube channels, Twitch Streaming, and a podcast.{" "}
      </p>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a href="https://www.purpleelephant.tv/">Live Site</a>
          </p>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a href="https://github.com/MSBivens/pep">Github Repo</a>
          </p>
        </li>
      </ul>
      {/* DeltaSigVandals.org */}
      <h3>Fraternity Website for Alumni</h3>
      <p>
        This is a marketing website to funnel alumni members toward donating to
        support efforts like scholarship endowments and facility upgrades.
      </p>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a href="https://www.deltasigvandals.org/">Live Site</a>
          </p>
        </li>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a href="https://github.com/MSBivens/dsp">Github Repo</a>
          </p>
        </li>
      </ul>
      {/* TAAM */}
      <h3>Theatre Audition Application Manager (TAAM)</h3>
      <p>
        Web application to help local theatres manage actor applications for
        their productions. This was a student project for the capstone course.
      </p>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          <p>
            <a href="https://github.com/MSBivens/TAAM-repo">Github Repo</a>
          </p>
        </li>
      </ul>
      {/* END */}
    </div>
  );
}
