/**
 * The sign-off: one black pill echoing the header's dynamic island, so the page
 * opens and closes on the same shape.
 *
 * Everything that used to be here — a heading, a pitch, and a card per social
 * channel — was the same three links written out three times. The pill is the
 * whole footer now. LinkedIn and GitHub open beside the page; llms.txt opens in a
 * dialog, so nothing here ever navigates away.
 */

import { useState } from "react";
import LlmsDialog from "./LlmsDialog";
import { socials } from "../data/profile";

const hrefFor = (id) => socials.find((social) => social.id === id)?.href;

const SIGN_OFF = [
  { label: "LinkedIn", href: hrefFor("linkedin"), external: true },
  { label: "Github", href: hrefFor("github"), external: true },
  // mailto: hands off to a mail client, so a new tab would just flash and close.
  { label: "Email", href: hrefFor("email"), external: false },
];

export default function Footer() {
  const [showLlms, setShowLlms] = useState(false);

  return (
    <footer id="socials" className="scroll-mt-24 py-14">
      <div className="flex justify-center">
        <nav className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-[#232323] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:gap-1.5 sm:px-6">
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

          <button type="button" onClick={() => setShowLlms(true)} className="island-link">
            llms.txt
            <span className="text-[#4d9bff]">.</span>
          </button>
        </nav>
      </div>

      {showLlms ? <LlmsDialog onClose={() => setShowLlms(false)} /> : null}
    </footer>
  );
}
