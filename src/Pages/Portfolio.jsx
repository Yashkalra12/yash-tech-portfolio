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
import ThemeToggle from "../ui/ThemeToggle";
import RagTerminal from "../features/ragTerminal/RagTerminal";
import { HandControlProvider } from "../features/handControl/HandControlProvider";
import HandCursor from "../features/handControl/HandCursor";
import PermissionGate from "../features/handControl/PermissionGate";

export default function Portfolio() {
  return (
    <HandControlProvider>
      <div className="page-shell min-h-screen">
        <Header />

        {/* Top-right controls: theme, then the camera. Below the header island on
            phones, where the expanded island is nearly the full width. */}
        <div className="fixed right-3 top-[4.75rem] z-[9996] flex items-center gap-2 sm:top-3">
          <ThemeToggle />
          <PermissionGate />
        </div>

        {/* Extra top padding on phones, where the controls sit under the island
            rather than beside it and would otherwise land on the hero. */}
        <main className="mx-auto w-[92%] max-w-[1300px] pt-36 sm:pt-24">
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
      </div>
    </HandControlProvider>
  );
}
