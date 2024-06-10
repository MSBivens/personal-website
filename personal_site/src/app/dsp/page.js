import Image from "next/image";

import dspImage from "../../../public/images/dsp.jpg";

export default function DSP() {
  return (
    <div>
      <h1>Delta Sigma Phi</h1>
      <p>
        I have a long history of volunteer service with Gamma Iota, starting as
        an undergraduate where I helped refound the chapter and held several
        leadership roles.
      </p>
      <p>
        As an alumnus, I spearheaded the restructuring of the advising board,
        represented the chapter at national events, provided member counseling,
        and engaged in alumni recruitment efforts. I also ensured the
        chapter&apos;s recognition as a student organization, developed
        leadership programs, and organized events to foster engagement and
        fundraising.
      </p>
      <p>
        Currently, I focus on compliance, reorganizing the alumni corporation
        board, and creating comprehensive guides and events to support our
        undergraduate and alumni chapter&apos;s growth and success.
      </p>
      <Image
        src={dspImage}
        alt="picture of Michael in a suit, wearing fraternity garb"
        className="mx-auto mb-4"
      />
      <h2>Relevant Publications</h2>
      <p>
        I appeared in the national publication, The Carnation, on page 10,
        sharing my experience as a first-generation student.
      </p>
      <p>
        <a href="https://issuu.com/deltasigmaphihq/docs/springcarnation24_finalweb">
          The Carnation - Volume 114, Issue 1
        </a>
      </p>
      <h2>Volunteer Experience</h2>
      <h3>Alumni Roles</h3>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          President, Alumni Corporation Board, Gamma Iota Chapter, 2022-Present
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Lead Advisor, Collegiate Chapter Advisory Board, Gamma Iota Chapter,
          2020-2022
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Advisor, Collegiate Chapter Advisory Board, Gamma Iota Chapter,
          2019-2020
        </li>
      </ul>
      <h3>Undergraduate Roles</h3>
      <ul className="list-disc" style={{ color: "black", marginLeft: "2em" }}>
        <li style={{ marginBottom: "1rem" }}>
          Chapter President, Gamma Iota Chapter, 2018-2019
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Director of Recruitment, Gamma Iota Chapter, 2017-2018
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Secretary, Gamma Iota Chapter, 2016-2017
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Director of Philanthropy, Gamma Iota Chapter, 2015-2016
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Director of Academics, Gamma Iota Chapter, 2015-2016
        </li>
        <li style={{ marginBottom: "1rem" }}>
          Pledge Class President, Gamma Iota Chapter, 2015-2016
        </li>
      </ul>
    </div>
  );
}
