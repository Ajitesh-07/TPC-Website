const HeadMessage = () => {
  return (
    <section className="py-24 px-gutter-desktop bg-surface">
      <div className="max-w-container-max mx-auto">
        <div className="glass-panel rounded-xl elevation-2 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Portrait */}
          <div className="lg:col-span-4 bg-navy-deep flex flex-col items-center justify-center p-10 text-center">
            <div className="w-40 h-40 rounded-full bg-primary-fixed/20 border-4 border-gold-leaf/40 flex items-center justify-center overflow-hidden mb-6">
              <span className="material-symbols-outlined text-[80px] text-tertiary-fixed-dim">person</span>
            </div>
            <div className="text-title-lg font-title-lg text-on-primary">Prof. [Name]</div>
            <div className="text-label-md font-label-md text-tertiary-fixed-dim mt-1">
              Head, Training &amp; Placement Cell
            </div>
            <div className="text-label-sm font-label-sm text-gold-leaf mt-1 uppercase tracking-wider">
              IIT Patna
            </div>
          </div>

          {/* Message */}
          <div className="lg:col-span-8 p-10 lg:p-14 flex flex-col justify-center">
            <span className="material-symbols-outlined text-gold-leaf text-[40px] mb-2">format_quote</span>
            <h2 className="text-headline-md font-headline-md text-primary mb-5">
              A Message from the Head of Placement
            </h2>
            <p className="text-body-lg font-body-lg text-text-secondary mb-4">
              At IIT Patna, we take immense pride in nurturing engineers and innovators who
              are ready to take on the world's most demanding challenges. Our students
              combine deep technical mastery with the adaptability that modern industry
              demands.
            </p>
            <p className="text-body-md font-body-md text-text-secondary">
              To our recruiting partners — we invite you to engage with a talent pool that
              is curious, committed, and exceptionally well-prepared. We look forward to
              building a lasting and mutually rewarding association with your organisation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeadMessage;
