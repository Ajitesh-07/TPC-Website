import Button from "@/components/ui/Button";

// Campus image doubles as the video poster until a real placement reel is
// dropped into /public/placement-reel.mp4. Video is muted + looping per brief.
const POSTER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCLpYS4iIfaO68kr9Ts-WHiAy6pqxojEABF7hhSl6uA3jaXNK_dU-2KBprtotjAyFKzs8vID47IMVFNXVe5lyUpXmCX8NjLoWmPrC-74XZNA6-jhcc16BQQx0HaVlhvGdIjjK4sBDHOarD3jRnqqPZ6p0n0FY881Q1ttCQHHYqBfyMVwEYZFPUo56RsCnpGMJuPFTcwYO6KgNZu7Zb5PDAqZY4b2t7wzdgoH7VL7avY8QmHXkJjTjKPkb9L5lYHLsc3vy8EB28SwtJ9";

const Hero = () => {
  return (
    <section className="relative w-full h-[819px] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background video (falls back to the poster until the reel is added). */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover object-center"
          autoPlay
          loop
          muted
          playsInline
          poster={POSTER_IMAGE}
          aria-hidden="true"
        >
          <source src="/placement-reel.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-navy-deep/70 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 text-center px-gutter-desktop md:max-w-container-max mx-auto w-full flex flex-col items-center">
        <span className="inline-block py-1 px-3 rounded-full bg-surface-container/20 text-on-primary text-label-sm font-label-sm border border-white/10 mb-6 backdrop-blur-md">
          Training &amp; Placement Cell &middot; IIT Patna
        </span>
        <h1 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-on-primary mb-6 max-w-4xl tracking-tight leading-tight">
          Empowering Innovation,
          <br />
          Engineering the Future.
        </h1>
        <p className="text-body-lg font-body-lg text-tertiary-fixed-dim max-w-2xl mb-10">
          Connecting world-class talent with global industry leaders. Discover
          the minds shaping tomorrow&apos;s technology landscape at IIT Patna.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            href="#contact"
            variant="gold"
            size="lg"
            icon="arrow_forward"
            iconPosition="right"
          >
            For Recruiters
          </Button>
          <Button href="#portal-access" variant="glass" size="lg">
            Student Portal
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
