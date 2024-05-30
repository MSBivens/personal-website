export default function Navbar() {
  return (
    <nav className="bg-gray-800">
      <ul className="flex justify-center space-x-4 py-4">
        <li>
          <a href="/" className="text-white hover:text-gray-300">
            Home
          </a>
        </li>
        <li>
          <a href="dev" className="text-white hover:text-gray-300">
            Dev Portfolio
          </a>
        </li>
        <li>
          <a href="podcasts" className="text-white hover:text-gray-300">
            Podcasts
          </a>
        </li>
        <li>
          <a href="aracthius" className="text-white hover:text-gray-300">
            Aracthius
          </a>
        </li>
        <li>
          <a href="dsp" className="text-white hover:text-gray-300">
            DSP
          </a>
        </li>
        <li>
          <a href="lists" className="text-white hover:text-gray-300">
            Lists
          </a>
        </li>
        {/* Future Development */}
        {/* <li>
          <a href="#" className="text-white hover:text-gray-300">
            Blog
          </a>
        </li> */}
      </ul>
    </nav>
  );
}
