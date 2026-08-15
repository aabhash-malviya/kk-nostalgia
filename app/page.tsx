import Clock from "@/components/Clock";
import ListenerCount from "@/components/ListenerCount";
import SocialLinks from "@/components/SocialLinks";
import Player from "@/components/Player";

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='grain-noise'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter>
  <rect width='100%' height='100%' filter='url(%23grain-noise)'/>
</svg>`;
const grainDataUri = `data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}`;

const safeTop = "top-[max(1rem,env(safe-area-inset-top))]";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden">
      <div className="hero-bg z-0 bg-cover bg-center" />
      <div className="fixed inset-0 z-10 bg-gradient-to-b from-black/35 via-transparent to-black/80 pointer-events-none" />
      <div className="grain-overlay z-10" style={{ backgroundImage: `url("${grainDataUri}")` }} />

      <div
        className={`fixed z-20 ${safeTop} left-[max(1rem,env(safe-area-inset-left))]`}
      >
        <Clock />
      </div>
      <div className={`fixed z-20 ${safeTop} left-1/2 -translate-x-1/2`}>
        <ListenerCount />
      </div>
      <div
        className={`fixed z-20 ${safeTop} right-[max(1rem,env(safe-area-inset-right))]`}
      >
        <SocialLinks />
      </div>

      {/* Empty flow spacer: the top row above is all `fixed` (out of flow),
          so without this, Player would be main's only flex child and
          `justify-between` would sit it at the top instead of the bottom. */}
      <div aria-hidden className="mt-24 sm:mt-20" />
      <Player />
    </main>
  );
}
