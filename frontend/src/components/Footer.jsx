function Footer() {
  return (
    <footer className="bg-dark-950 text-dark-200 py-8 px-6 border-t border-dark-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        
        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold text-dark-50 flex items-center">
            <span className="text-primary-500 mr-1">&lt;/&gt;</span> Versatile
          </h1>
          <p className="mt-2 text-sm">Your Esports Career Hub</p>
        </div>

        {/* Links Sections */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          
          <div>
            <h3 className="text-dark-100 font-semibold mb-2">Features</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-primary-500">Features</a></li>
              <li><a href="#" className="hover:text-primary-500">How to Use</a></li>
              <li><a href="#" className="hover:text-primary-500">Leaderboard</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-dark-100 font-semibold mb-2">Legal</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-primary-500">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-500">Terms & Conditions</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-dark-100 font-semibold mb-2">Social</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-primary-500">Twitter</a></li>
              <li><a href="#" className="hover:text-primary-500">Discord</a></li>
              <li><a href="#" className="hover:text-primary-500">LinkedIn</a></li>
            </ul>
          </div>

        </div>

      </div>
      <div className="text-center text-sm mt-6 text-dark-300">
        © {new Date().getFullYear()} Versatile. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
