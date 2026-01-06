// Experience.js
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import MagicButton from "./utils/MagicButton";
import { FaLocationArrow } from "react-icons/fa6";
import { Tilt } from "react-tilt";


const Experience = () => {
  const textRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      textRef.current,
      { xPercent: -100 },
      {
        xPercent: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 180%",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }, []);

  const experienceData = [
    {
      id: 1,
      companyName: "Munshot PTE Ltd",
      shortName: "Munshot",
      role: "Full Stack Developer",
      duration: "Feb 2025 - Jan 2026",
      image: "assets/munsgot_logo.png",
      responsibilities: [
        "Engineered an AI-based stock market analyzer application, focusing on developing and testing essential APIs to ensure functionality and performance.",

        "Implemented an Analysts Agents screen, integrating 10+ APIs from scratch in the frontend handling the complete process from design to functionality.",

        "Built a Stocks Portfolio panel from scratch, integrating it with existing screens, implementing toggle functionality, and enabling stock listing by fetching data from the Redux store."
      ],
      certificateLink: "https://www.linkedin.com/company/munshot/about/",
    },
    {
      id: 2,
      companyName: "Lumio AI",
      shortName: "Lumio AI",
      role: "SWE",
      duration: "Sep 2024 – Feb 2025",
      image: "assets/LumioAi.png",
      responsibilities: [
        "Built and deployed 5+ projects from scratch using React, Angular, Next.js, and FastAPI.",

        "Integrated AI APIs and built frontend UIs for apps used by US-based clients.",

        "Converted desktop software into web apps using Three.js and tested features using Pytest.",

        "Developed a flagging system in a monorepo to validate data from thousands of PDFs against ground truth JSON, improving accuracy by 80%."
      ],
      certificateLink: "https://www.teamlumio.ai/", 
    },
    
  ];

  return (
    <div className="w-[92%]  mx-auto mt-20 md:mt-40" id="experience">
      <p
        ref={textRef}
        className="uppercase text-3xl md:text-6xl text-center md:text-left font-bold"
      >
        My <span className="text-[#CBACF9]">Experiences</span>
      </p>

      {experienceData.map((experience) => (
        <div className="mt-5 md:mt-10" data-aos="fade-up" key={experience.id}>
          <Tilt options={{ max: 10, scale: 1 }} className="flex flex-col md:flex-row gap-10 p-3 bg-gradient-to-br from-[#010320] to-[#111325] rounded-xl border border-gray-600">
            <div className="flex-shrink-0 w-full max-w-xs md:w-96 h-40 md:h-48 flex items-center justify-center rounded-lg mx-auto">
              <img
                src={experience.image}
                alt={experience.companyName}
                className="rounded-lg w-full h-auto max-h-40 md:max-h-48 object-contain transform translate-y-[40%]"
              />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold hidden md:block">
                {experience.companyName}
              </p>
              <p className="text-2xl md:text-3xl font-bold md:hidden block">
                {experience.shortName}
              </p>
              <p className="text-md md:text-lg font-medium">
                {experience.role}
              </p>
              <p className="font-medium text-gray-400 text-lg">
                {experience.duration}
              </p>
              <div className="space-y-1 mt-5 text-sm md:text-base">
                {experience.responsibilities.map((task, index) => (
                  <p key={index}>• {task}</p>
                ))}
              </div>

              <div className="flex justify-center md:justify-between gap-5 my-5">
                <Link to={experience.certificateLink} target="_blank">
                  <MagicButton
                    title="Website"
                    w={40}
                    icon={<FaLocationArrow />}
                    position="right"
                  />
                </Link>
              </div>
            </div>
          </Tilt>
        </div>
      ))}
    </div>
  );
};

export default Experience;
