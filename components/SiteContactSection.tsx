"use client";

import { Github, Linkedin, Mail } from "lucide-react";

export default function SiteContactSection() {
  return (
    <section id="contact" className="min-h-screen bg-green-100 px-5 py-20 text-green-950 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Contact</p>
          <h2 className="mt-6 max-w-xl text-5xl font-medium leading-[1.08] tracking-normal md:text-7xl">
            Want to talk about Bourse?
          </h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-green-950/60 md:text-lg">
            I built Bourse as a personal stock research project. Send feedback, report an issue, or share an
            idea for improving the workflow.
          </p>

          <div className="mt-10 flex flex-col gap-5 text-sm font-semibold text-green-950/65">
            <a
              href="mailto:sairithwikkukunuri@gmail.com"
              className="inline-flex w-fit items-center gap-3 rounded-lg border border-black/10 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-green-950 hover:shadow-md"
            >
              <Mail className="size-4 text-emerald-700" />
              sairithwikkukunuri@gmail.com
            </a>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/ZB-ZettaByte/Bourse"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-green-950 hover:shadow-md"
              >
                <Github className="size-4" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-green-950 hover:shadow-md"
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
          className="w-full rounded-lg border border-black/10 bg-white p-6 text-black shadow-xl shadow-black/10 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-bold">
              <span>Name</span>
              <input
                name="name"
                className="h-12 w-full rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </label>
            <label className="space-y-2 text-sm font-bold">
              <span>Email</span>
              <input
                name="email"
                type="email"
                className="h-12 w-full rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </label>
          </div>
          <label className="mt-6 block space-y-2 text-sm font-bold">
            <span>Message</span>
            <textarea
              name="message"
              rows={6}
              placeholder="Share feedback, a bug you found, or an idea for the project..."
              className="w-full resize-none rounded-lg border border-black/15 bg-white px-4 py-4 text-sm font-semibold outline-none transition placeholder:text-black/40 focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </label>
          <button
            type="submit"
            className="mt-6 h-12 w-full rounded-lg bg-black text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-black hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Send Message
          </button>
          <p className="mt-4 text-center text-xs font-medium text-black/45">
            This opens your email app so the project does not need a contact backend yet.
          </p>
        </form>
      </div>
    </section>
  );
}
