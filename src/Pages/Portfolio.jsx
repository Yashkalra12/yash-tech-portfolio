/**
 * The rebuilt portfolio page.
 *
 * Section order mirrors the reference (intro → about → skills → projects →
 * footer), with experience and education slotted in where a graduate CV needs
 * them, and the two original features — the RAG terminal and llms.txt — given
 * their own sections before the footer.
 */

import Header from "../ui/Header";
import Intro from "../ui/Intro";
import AboutMe from "../ui/AboutMe";
import Experience from "../ui/Experience";
import SkillSet from "../ui/SkillSet";
import Projects from "../ui/Projects";
import Education from "../ui/Education";
import LlmsSection from "../ui/LlmsSection";
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
          <LlmsSection />
          <Footer />
        </div>

        <HandCursor />
        <PermissionGate />
      </div>
    </HandControlProvider>
  );
}
