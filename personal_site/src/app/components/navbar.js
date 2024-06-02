export default function Navbar() {
  return (
    <nav className="py-2 border-b-2 border-gray-600 mb-6">
      <ul className="flex flex-wrap justify-center space-x-4 py-4 ">
        <li>
          <a href="/" className="text-black hover:text-green-600 text-lg">
            Home
          </a>
        </li>
        <li>
          <a href="dev" className="text-black hover:text-green-600 text-lg">
            Dev Portfolio
          </a>
        </li>
        <li>
          <a
            href="podcasts"
            className="text-black hover:text-green-600 text-lg"
          >
            Podcasts
          </a>
        </li>
        <li>
          <a href="illorim" className="text-black hover:text-green-600 text-lg">
            Illorim
          </a>
        </li>
        <li>
          <a href="dsp" className="text-black hover:text-green-600 text-lg">
            DSP
          </a>
        </li>
        <li>
          <a href="lists" className="text-black hover:text-green-600 text-lg">
            Lists
          </a>
        </li>
        {/* Future Development */}
        {/* <li>
          <a href="#" className="text-black hover:text-green-300 text-lg">
            Blog
          </a>
        </li> */}
      </ul>
    </nav>
  );
}
