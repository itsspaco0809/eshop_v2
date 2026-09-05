import { useState, useRef, useEffect } from 'react';
import { Mail, Clock, Send, MessageSquare } from 'lucide-react';
import gsap from 'gsap';
import { supabase } from '@/lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.contact-animate-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
          onComplete: function () {
            const elements = containerRef.current?.querySelectorAll('.contact-animate-card');
            elements?.forEach((el) => el.classList.remove('opacity-0', 'translate-y-6'));
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const { error } = await supabase.from('contact_messages').insert([form]);

      if (error) {
        throw error;
      }

      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });

      setTimeout(() => {
        setStatus('idle');
      }, 4000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors';

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* 
        Header with Navbar offset pt-16 md:pt-20 
        and balanced padding pt-12 pb-8 md:pt-16 md:pb-10
      */}
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-7 h-7 text-neutral-900 dark:text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Get in Touch
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg">
            Questions about a kit? Want a custom build? We're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info boxes */}
          <div className="lg:col-span-1 space-y-4">
            {[
              { icon: Mail, label: 'Email', value: 'cs@lcpworks.com', sub: 'We reply within 24h' },
              { icon: Clock, label: 'Build Time', value: '4-6 weeks', sub: 'For custom orders' },
            ].map((item, i) => (
              <div
                key={i}
                className="contact-animate-card opacity-0 translate-y-6 will-change-transform flex items-start gap-4 p-5 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-neutral-900 dark:text-white" />
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                    {item.label}
                  </p>
                  <p className="text-neutral-900 dark:text-white font-semibold mt-0.5">{item.value}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form box */}
          <div className="lg:col-span-2">
            <div className="contact-animate-card opacity-0 translate-y-6 will-change-transform bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h2 className="text-neutral-900 dark:text-white font-bold text-lg">Send a Message</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">
                    Subject
                  </label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className={inputClass}
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={inputClass + ' resize-none'}
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    'Sending...'
                  ) : status === 'sent' ? (
                    'Message Sent!'
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
                {status === 'sent' && (
                  <p className="text-center text-emerald-600 dark:text-emerald-400 text-sm">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-center text-red-500 text-sm">
                    {errorMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}