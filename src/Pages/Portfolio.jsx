/**
 * The rebuilt portfolio page.
 *
 * Section order: intro → about → experience → skills → projects → education,
 * then the RAG terminal, then the footer.
 *
 * Nothing here navigates away from the page. Section links scroll, projects open
 * in a dialog, and the handful of genuinely external links (LinkedIn, GitHub, the
 * résumé) open in a new tab, so this document is never replaced.
 */

import Header from "../ui/Header";
import Intro from "../ui/Intro";
import AboutMe from "../ui/AboutMe";
import Experience from "../ui/Experience";
import SkillSet from "../ui/SkillSet";
import Projects from "../ui/Projects";
import Education from "../ui/Education";
import Footer from "../ui/Footer";
import RagTerminal from "../features/ragTerminal/RagTerminal";
import { HandControlProvider } from "../features/handControl/HandControlProvider";
import HandCursor from "../features/handControl/HandCursor";
import PermissionGate from "../features/handControl/PermissionGate";

export default function Portfolio() {
  return (
    <HandControlProvider>
      <div className="min-h-screen bg-white text-[#101828]">
        <Header />

        <main className="mx-auto w-[92%] max-w-[1300px] pt-24">
          <Intro />
          <AboutMe />
          <Experience />
          <SkillSet />
          <Projects />
          <Education />
        </main>

        {/* RagTerminal centres itself, so it sits outside the shared wrapper. */}
        <RagTerminal />

        <div className="mx-auto w-[92%] max-w-[1300px]">
          <Footer />
        </div>

        <HandCursor />
        <PermissionGate />
      </div>
    </HandControlProvider>
  );
}
