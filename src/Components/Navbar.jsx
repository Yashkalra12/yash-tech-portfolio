import React from "react";
import { FaHome, FaUser, FaBriefcase, FaCode, FaGraduationCap, FaProjectDiagram, FaEnvelope } from "react-icons/fa";

const Navbar = () => {
  const sections = [
    { id: 'home', icon: <FaHome />, text: 'Home' },
    { id: 'about', icon: <FaUser />, text: 'About' },
    { id: 'experience', icon: <FaBriefcase />, text: 'Experience' },
    { id: 'projects', icon: <FaProjectDiagram />, text: 'Projects' },
    { id: 'skills', icon: <FaCode />, text: 'Skills' },
    { id: 'education', icon: <FaGraduationCap />, text: 'Education' },
    { id: 'contact', icon: <FaEnvelope />, text: 'Contact' },
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY; // Get the top position of the section
      const offsetPosition = sectionTop - 100; // Subtract 100 pixels from the top position
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex justify-center mx-auto">
      <div className="flex justify-evenly fixed gap-5 items-center w-[90%] mx-auto mt-3 border-[0.1px] py-5 text-lg font-medium isolate backdrop-blur-sm rounded-xl bg-black/20 shadow-lg ring-1 ring-black/5 z-50">
        {sections.map((section) => (
          <React.Fragment key={section.id}>
            <a onClick={() => scrollToSection(section.id)} className="sm:hidden cursor-pointer hover:text-[#CBACF9]">
              {section.icon}
            </a>
            <a onClick={() => scrollToSection(section.id)} className="hidden sm:block cursor-pointer hover:text-[#CBACF9]">
              {section.text}
            </a>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
