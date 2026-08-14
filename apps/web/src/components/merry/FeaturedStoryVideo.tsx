import { useRef, useState } from 'react';

export function FeaturedStoryVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoAvailable, setVideoAvailable] = useState(true);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || !videoAvailable) return;
    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  return (
    <section className="relative z-20 bg-[#171735] pb-10 pt-8 md:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group relative aspect-[16/7] min-h-[250px] overflow-hidden rounded-[2rem] border-[7px] border-white bg-[#10172a] shadow-[0_28px_70px_rgba(16,23,42,.28)] md:rounded-[2.75rem]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster="/hero_vibrant.png"
            preload="metadata"
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setVideoAvailable(false)}
          >
            <source src="/merrytales-story.mp4" type="video/mp4" />
          </video>

          <div className={`pointer-events-none absolute inset-0 bg-[#10172a]/25 transition duration-500 ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} />

          <button
            type="button"
            onClick={togglePlayback}
            disabled={!videoAvailable}
            aria-label={playing ? 'Pause the MerryTales story video' : 'Play the MerryTales story video'}
            className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/92 p-4 shadow-[0_16px_45px_rgba(0,0,0,.28)] backdrop-blur-md transition duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 md:p-5 ${playing ? 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100' : 'hover:scale-105'} ${!videoAvailable ? 'cursor-default' : ''}`}
          >
            <img src="/logo.png" alt="" className="h-auto w-28 md:w-40" />
            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[.24em] text-[#171735]">{videoAvailable ? (playing ? 'Pause story' : 'Play our story') : 'Our story'}</span>
          </button>

          {!playing && <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[.2em] text-white/85 md:bottom-7">Discover what MerryTales makes possible</p>}
        </div>
      </div>
    </section>
  );
}
