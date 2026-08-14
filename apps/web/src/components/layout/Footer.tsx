import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-[#fde8ef] text-[#10172a] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <img src="/logo.png" alt="Merry Tales" className="h-20 w-auto mb-4" />
            <p className="text-xs tracking-wider uppercase font-semibold text-[#10172a] mb-3">
              Your Story. Our Studio. Pure Bliss.
            </p>
            <p className="text-xs text-[#10172a]/75 mb-1">📍 Nairobi, Kenya</p>
            <p className="text-xs text-[#10172a]/75 mb-1">📱 M-Pesa Payments Accepted</p>
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="text-xs text-[#10172a] hover:text-primary flex items-center mt-2">
              <FaWhatsapp className="mr-1.5" />
              WhatsApp: +254 700 000 000
            </a>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Our Services</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/stories" className="text-[#10172a]/80 hover:text-primary transition-colors">Memory Tale</Link></li>
              <li><Link to="/create" className="text-[#10172a]/80 hover:text-primary transition-colors">Story Tale & Brand Kit</Link></li>
              <li><Link to="/shop/memory-tale-website" className="text-[#10172a]/80 hover:text-primary transition-colors">Event Websites</Link></li>
              <li><Link to="/shop/maji-labels-dusty-rose" className="text-[#10172a]/80 hover:text-primary transition-colors">Custom Maji Labels</Link></li>
              <li><Link to="/shop/invitation-suite-sage" className="text-[#10172a]/80 hover:text-primary transition-colors">Printable Cards & Stationery</Link></li>
              <li><Link to="/app/invitation" className="text-[#10172a]/80 hover:text-primary transition-colors">Animated WhatsApp Invites</Link></li>
              <li><Link to="/gifts" className="text-[#10172a]/80 hover:text-primary transition-colors">Gifts & Registries</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Occasions</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/vendors?category=ruracio" className="text-[#10172a]/80 hover:text-primary transition-colors">Ruracio & Traditional</Link></li>
              <li><Link to="/vendors" className="text-[#10172a]/80 hover:text-primary transition-colors">Weddings</Link></li>
              <li><Link to="/shop" className="text-[#10172a]/80 hover:text-primary transition-colors">Baby Showers</Link></li>
              <li><Link to="/shop" className="text-[#10172a]/80 hover:text-primary transition-colors">Graduations & Parties</Link></li>
              <li><Link to="/stories/real-weddings" className="text-[#10172a]/80 hover:text-primary transition-colors">Engagements</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className="text-[#10172a]/80 hover:text-primary transition-colors">Who We Are</Link></li>
              <li><Link to="/vendor/join" className="text-[#10172a]/80 hover:text-primary transition-colors">Join as a Vendor</Link></li>
              <li><Link to="/vendor" className="text-[#10172a]/80 hover:text-primary transition-colors">Vendor Portal</Link></li>
              <li><Link to="/plan" className="text-[#10172a]/80 hover:text-primary transition-colors">Planning Center</Link></li>
              <li><Link to="/partners" className="text-[#10172a]/80 hover:text-primary transition-colors">Partners & Integrations</Link></li>
              <li><a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="text-[#10172a] hover:text-primary transition-colors">Contact Studio (WhatsApp)</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#10172a]/15 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 text-center text-sm text-[#10172a]/70 md:mb-0 md:text-left">
            <p>&copy; {new Date().getFullYear()} Merry Tales. All rights reserved.</p>
            <p className="mt-1">
              A product of{' '}
              <a href="https://amalgamate.co.ke" target="_blank" rel="noopener noreferrer" className="font-extrabold text-[#10172a] transition-colors hover:text-primary hover:underline">
                Amalgamate+
              </a>
            </p>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-[#10172a] hover:text-primary transition-colors" aria-label="Facebook">
              <FaFacebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-[#10172a] hover:text-primary transition-colors" aria-label="Instagram">
              <FaInstagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-[#10172a] hover:text-primary transition-colors" aria-label="TikTok">
              <FaTiktok className="h-5 w-5" />
            </a>
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="text-[#10172a] hover:text-primary transition-colors" aria-label="WhatsApp">
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
