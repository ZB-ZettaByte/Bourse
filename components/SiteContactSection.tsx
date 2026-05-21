"use client";

import { Github, Linkedin, Mail } from "lucide-react";

export default function SiteContactSection() {
  return (
    <section id="contact" className="min-h-screen border-y border-green-900/10 bg-green-100 px-5 py-20 text-green-900 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col justify-center">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Contact</p>
          <h2 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-normal md:text-6xl">
            Want to talk about Bourse?
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-green-950/60 md:text-lg">
            Send feedback, report an issue, or share an idea for better market research workflows.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 text-sm font-semibold text-green-950/65">
            <a
              href="mailto:sairithwikkukunuri@gmail.com"
              className="inline-flex w-fit items-center gap-3 rounded-lg border border-green-900/10 bg-white px-4 py-3 shadow-sm transition-colors hover:border-emerald-600/40 hover:text-green-950"
            >
              <Mail className="size-4 text-emerald-600" />
              sairithwikkukunuri@gmail.com
            </a>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-900/10 bg-white px-4 py-3 shadow-sm transition-colors hover:border-emerald-600/40 hover:text-green-950"
              >
                <Github className="size-4" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-green-900/10 bg-white px-4 py-3 shadow-sm transition-colors hover:border-emerald-600/40 hover:text-green-950"
              >
                <Linkedin className="size-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <form
          action="mailto:sairithwikkukunuri@gmail.com"
          method="post"
          encType="text/plain"
          className="mx-auto mt-12 w-full max-w-2xl rounded-lg border border-green-900/10 bg-white p-5 text-green-950 shadow-2xl shadow-emerald-950/10 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-bold">
              <span>Name</span>
              <input
                name="name"
                className="h-12 w-full rounded-lg border border-green-900/15 bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="space-y-2 text-sm font-bold">
              <span>Email</span>
              <input
                name="email"
                type="email"
                className="h-12 w-full rounded-lg border border-green-900/15 bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
          <label className="mt-6 block space-y-2 text-sm font-bold">
            <span>Message</span>
            <textarea
              name="message"
              rows={6}
              placeholder="Share feedback, a bug you found, or an idea for the project..."
              className="w-full resize-none rounded-lg border border-green-900/15 bg-white px-4 py-4 text-sm font-semibold outline-none transition placeholder:text-green-950/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="submit"
            className="mt-6 h-12 w-full rounded-lg bg-green-900 text-sm font-bold text-white transition-colors hover:bg-emerald-500 hover:text-green-950"
          >
            Send Message
          </button>
          <p className="mt-4 text-center text-xs font-medium text-green-950/45">
            This opens your email app so the project does not need a contact backend yet.
          </p>
        </form>
      </div>
    </section>
  );
}
