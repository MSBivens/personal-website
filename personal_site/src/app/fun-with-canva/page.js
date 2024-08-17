import Image from "next/image";

import fwc1 from "../../../public/images/fwc1.png";
import fwc2 from "../../../public/images/fwc2.png";
import fwc3 from "../../../public/images/fwc3.png";
import fwc4 from "../../../public/images/fwc4.png";
import fwc5 from "../../../public/images/fwc5.png";
import fwc6 from "../../../public/images/fwc6.png";

export default function FunWithCanva() {
  return (
    <div>
      <h1>Fun With Canva</h1>
      <p>
        I also enjoy throwing togeter graghics on Canva, either as fun creative
        efforts or to use as invites for friends to hosted functions.
        Here&apos;s a select few of my favorites.
      </p>
      <p>
        I have often joked that I am a certified, card-carrying member of the
        peace keapers club, then I realized I had to actually carry one in my
        wallet.
      </p>
      <Image src={fwc1} alt="members card" className="mx-auto mb-4" />
      <p>
        Rummikub is best played early in the morning with your mom and a cup of
        coffee.
      </p>
      <Image src={fwc2} alt="rummikub rocket" className="mx-auto mb-4" />
      <p>
        A friend thinks shrimp are stinky and asked for me to make something for
        it.
      </p>
      <Image src={fwc3} alt="girl holding a shrimp" className="mx-auto mb-4" />
      <p>A skate themed house party invitation.</p>
      <Image src={fwc4} alt="girl on a skateboard" className="mx-auto mb-4" />
      <p>I was tired of hearing &quot;I dont know what to watch&quot;.</p>
      <Image src={fwc5} alt="girl on a skateboard" className="mx-auto mb-4" />
      <p>Another friend&apos;s challenge.</p>
      <Image src={fwc6} alt="girl on a skateboard" className="mx-auto mb-4" />
    </div>
  );
}
