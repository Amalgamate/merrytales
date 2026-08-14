interface PageHeroProps {
  label?: string;
  title: string;
  subtitle?: string;
  image: string;
  imageAlt?: string;
  overlay?: 'dark' | 'light' | 'gradient';
  textColor?: 'white' | 'dark';
  children?: React.ReactNode;
  height?: 'sm' | 'md' | 'lg';
}

const overlayStyles = {
  dark: 'bg-black/55',
  light: 'bg-white/40 backdrop-blur-sm',
  gradient: 'bg-gradient-to-r from-black/70 via-black/40 to-transparent',
};

export function PageHero({
  label,
  title,
  subtitle,
  image,
  imageAlt = '',
  overlay = 'dark',
  textColor = 'white',
  children,
  height: _height = 'md',
}: PageHeroProps) {
  const isWhite = textColor === 'white';

  return (
    <section className="relative z-20 h-[240px] md:h-[280px]">
      <div className="absolute inset-0 overflow-hidden">
      {/* Background Image */}
      <img
        src={image}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayStyles[overlay]}`}></div>

      {/* Grain texture for premium feel */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}></div>

      {/* Content */}
      </div>
      <div className="relative z-10 h-full flex flex-col justify-center text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
        {label && (
          <p className="font-bold uppercase tracking-[0.22em] mb-2 text-[10px] md:text-xs text-primary">
            {label}
          </p>
        )}
        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 md:mb-3 leading-tight ${isWhite ? 'text-white drop-shadow-md' : 'text-foreground'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-sm md:text-base max-w-2xl mx-auto ${children ? 'mb-0' : ''} ${isWhite ? 'text-white/85' : 'text-gray-700'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="absolute z-30 left-1/2 bottom-0 w-full -translate-x-1/2 translate-y-1/2 px-3 sm:px-6">{children}</div>}
    </section>
  );
}
