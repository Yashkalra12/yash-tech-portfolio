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
      companyName: "Salescode.ai",
      shortName: "Salescode.ai",
      role: "Software Engineer Trainee",
      duration: "24 September 2024 - Present",
      image: "assets/sc logo.svg",
      responsibilities: [
       "SalesCode.ai utilizes AI-driven RTM solutions to transform CPG sales processes and guarantee sales growth.",
        "The platform collaborates with over 65 leading CPG brands in 18 countries, backed by a team of 170+ experts.",
        "With over 3 million users and more than 1 billion transactions processed, SalesCode.ai delivers significant results in CPG sales",
      ],
      certificateLink: "https://salescode.ai/",
    },
    {
      id: 2,
      companyName: "Xeta Analytics Private Limited",
      shortName: "Xeta Analytics Pvt. Ltd.",
      role: "Frontend Web Development Intern",
      duration: "4 March 2024 - 31 July 2024",
      image: "assets/xeta.png",
      responsibilities: [
        "Developed CRM & CMS for DietSnap, enabling seamless user interaction and diet assignment by nutritionists.",
        "Enhanced DietSnap’s data visualization with MUI and Apex Charts for easy analysis.",
        "Led frontend development and API integration for FitSnap’s AI-powered workout feedback app.",
        "Deployed FitSnap on AWS EC2, ensuring reliable and accessible service.",
      ],
      certificateLink: "https://drive.google.com/file/d/15vY3AFnDyue5x_EcpxoM6jeierFvRulS/view?usp=sharing", 
    },
    {
      id: 3,
      companyName: "IEEE MSIT",
      shortName: "IEEE MSIT",
      role: "Video Editing Chairperson, Design Committee",
      duration: "December 2022 - January 2024",
      image: "assets/ieee.png",
      responsibilities: [
        "Led a team of 14 designers to produce captivating posters and videos for IEEE MSIT, leading to a 40% boost in social media engagement.",
        "Responsible for mentoring team members, equipping them with the skills to proficiently utilize Adobe Illustrator and Adobe Premier Pro.",
      ],
      certificateLink: "https://drive.google.com/file/d/1iXmTQMg_KL0a-tbIH8eUGsb-QyFF-kqu/view?usp=sharing", 
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
          <Tilt  options={{ max: 10,scale:1}} className="flex flex-col md:flex-row gap-10 p-3 bg-gradient-to-br from-[#010320] to-[#111325] rounded-xl border border-gray-600">
            {experience.id === 1 && (
              <video
                src="assets/sclogo.mp4"
                autoPlay
                loop
                muted
                className="w-96 z-50"
              />
            )}

           {experience.id!=1 &&  <img
              src={experience.image}
              alt={experience.companyName}
              className="rounded-lg w-96 object-scale-down"
            />}
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
                    title={experience.id==1 ? "Website" : "Certificate"}
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
