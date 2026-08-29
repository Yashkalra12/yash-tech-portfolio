/**
 * Socials + sign-off, following the reference's Footer: name, a handwritten
 * farewell, and a row of social links.
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

      <div className="mt-14 flex flex-col items-start gap-2 border-t border-[#ededed] pt-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-2xl font-bold">
            {identity.name} <span className="text-[#FE5E58]">.</span>
          </p>
          <p className="font-cartoon text-2xl text-[#FE5E58]">Until next time :p</p>
        </div>
        <div className="text-sm text-slate-400 md:text-right">
          <p>Designed and developed by me © {new Date().getFullYear()}</p>
          <p className="mt-1">
            UI inspired by{" "}
            <a
              href="https://github.com/AVIVASHISHTA29/Portfolio2021"
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-dotted hover:text-[#006AFF]"
            >
              Avi Vashishta&apos;s Portfolio2021
            </a>
            {" · "}
            <a href="/llms.txt" className="underline decoration-dotted hover:text-[#006AFF]">
              llms.txt
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
