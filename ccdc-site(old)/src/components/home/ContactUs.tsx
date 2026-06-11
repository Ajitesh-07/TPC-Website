'use client';

const CONTACT_DETAILS = [
  {
    icon: 'location_on',
    label: 'Address',
    value: 'Training & Placement Cell, IIT Patna, Bihta, Patna, Bihar – 801106',
  },
  { icon: 'mail', label: 'Email', value: 'tpc@iitp.ac.in' },
  { icon: 'call', label: 'Phone', value: '+91 612 302 8XXX' },
];

const ContactUs = () => {
  return (
    <section id="contact" className="py-24 px-gutter-desktop bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Info */}
        <div className="lg:col-span-5">
          <span className="text-label-md font-label-md text-navy-vibrant uppercase tracking-wider block mb-3">
            Get in Touch
          </span>
          <h2 className="text-headline-lg font-headline-lg text-primary mb-5">Contact Us</h2>
          <p className="text-body-lg font-body-lg text-text-secondary mb-8">
            For recruitment, internships, or collaboration enquiries, reach out to the
            Training &amp; Placement Cell. Our team will respond promptly.
          </p>

          <div className="flex flex-col gap-5">
            {CONTACT_DETAILS.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{item.icon}</span>
                </div>
                <div>
                  <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-1">
                    {item.label}
                  </div>
                  <div className="text-body-md font-body-md text-primary">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom form (preferred over Google Forms per brief) */}
        <div className="lg:col-span-7">
          <form
            className="glass-panel rounded-xl p-8 elevation-1 flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="input-glow rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-3 text-body-md text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-org" className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">
                  Organisation
                </label>
                <input
                  id="contact-org"
                  type="text"
                  className="input-glow rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-3 text-body-md text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder="Company / Institute"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="input-glow rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-3 text-body-md text-primary focus:border-primary focus:outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="text-label-md font-label-md text-text-secondary uppercase tracking-wider">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                className="input-glow rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-3 text-body-md text-primary focus:border-primary focus:outline-none transition-colors resize-none"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="btn-primary text-on-primary px-6 py-3.5 rounded-lg text-title-md font-title-md self-start hover:shadow-md transition-shadow duration-200"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
