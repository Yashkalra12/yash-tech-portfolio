/**
 * Socials + sign-off: a card per channel, then a black pill echoing the header's
 * dynamic island so the page opens and closes on the same shape.
 */

import { FaEnvelope, FaGithub, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import SectionHeading from "./SectionHeading";
import { identity, socials } from "../data/profile";

const ICONS = {
  linkedin: <FaLinkedin />,
  github: <FaGithub />,
  leetcode: <SiLeetcode />,
  email: <FaEnvelope />,
  whatsapp: <FaWhatsapp />,
};

const hrefFor = (id) => socials.find((social) => social.id === id)?.href;

/** The pill at the very bottom. Deliberately short — three ways to get in touch. */
const SIGN_OFF = [
  { label: "LinkedIn", href: hrefFor("linkedin"), external: true },
  { label: "Github", href: hrefFor("github"), external: true },
  // mailto: hands off to a mail client, so a new tab would just flash and close.
  { label: "Email", href: hrefFor("email"), external: false },
];

export default function Footer() {
  return (
    <footer id="socials" className="scroll-mt-24 border-t border-[#ededed] py-16">
      <SectionHeading dotColor="#FE5E58">Let&apos;s build something</SectionHeading>
      <p className="mt-2 max-w-xl text-slate-500">
        I am {identity.relocation.toLowerCase()}. If you are hiring, or you have an idea that
        needs building, the fastest route is email or LinkedIn.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {socials.map((social) => (
          <a
            key={social.id}
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-white"
              style={{ backgroundColor: social.color }}
            >
              {ICONS[social.id]}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{social.label}</span>
              <span className="block truncate text-xs text-slate-400">{social.handle}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Signs off with the same black pill as the header, so the page opens and
          closes on the same shape. No name, no copyright line — the heading above
          already says whose site this is. */}
      <div className="mt-14 flex justify-center">
        <nav className="flex items-center gap-1 rounded-full bg-[#232323] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:gap-1.5 sm:px-6">
          {SIGN_OFF.map((item) => (
            <a
              key={item.label}
              href={item.href}
              // Anything that leaves the site opens beside this page, never over it.
              {...(item.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              className="island-link"
            >
              {item.label}
              <span className="text-[#4d9bff]">.</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
