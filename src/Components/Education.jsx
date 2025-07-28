import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { VerticalTimeline } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { VerticalTimelineElement } from "react-vertical-timeline-component";

export const EducationCard = ({ education }) => {
  return (
    <VerticalTimelineElement
      icon={
        <div className="bg-gray-900 rounded-full object-cover w-full h-full">

        <img
          src={education.img}
          alt={education.school}
          className="object-cover w-full h-full m-auto rounded-full scale-75"
          />
          </div>
      }
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "#1d1836",
        color: "#fff",
        boxShadow: "rgba(23, 92, 230, 0.15) 0px 4px 24px",
        // backdropFilter: "blur(3px) saturate(106%)",
        backgroundColor: "rgba(17, 25, 40, 0.83)",
        border: "1px solid rgba(255, 255, 255, 0.125)",
        borderRadius: "6px",
      }}
      contentArrowStyle={{
        borderRight: "7px solid  rgba(255, 255, 255, 0.3)",
      }}
      date={education.date}
    >
      <div className="flex items-center">
        <img
          src={education.img}
          className="w-28 h-28 object-contain rounded-full"
        />
        <div className="ml-2">
          <span className="text-xl font-medium">{education.school}</span>
          <br />
          <span className="text-sm font-medium text-gray-300">
            {education.degree}
          </span>
          <br />
          <span className="text-sm font-medium text-gray-300">
            {education.date}
          </span>
          <div>
            <b>Grade :</b>
            {education.grade}
          </div>
        </div>
      </div>
      {/* <div>
        <span>{education.desc}</span>
      </div> */}
    </VerticalTimelineElement>
  );
};

const Education = () => {
  const education = [
    {
      id: 0,
      img: "assets/CUIETlogo.png",
      school: "Chitkara University Institute of Engineering and Technology, Punjab",
      date: "Oct 2021 - Jul 2025",
      grade: " 9.26 CGPA",
      desc: "I am currently pursuing a Bachelor's degree in Computer Science and Engineering at Chitkara University, Punjab. I have completed 7 semesters and have a CGPA of 9.22. I have taken courses in Data Structures, Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, and Computer Networks, among others..",
      degree: "B.E. Computer Science and Engineering",
    },
    {
      id: 1,
      img: "assets/CISlogo.jpg",
      school: "City International School, Lucknow",
      date: "Apr 2019 - Mar 2021",
      grade: " 91.6%",
      //   desc: "I completed my class 12 high school education at Methodist School, Dankuni, where I studied Science with Computer Science.",
      degree: "12th CSE, Science",
    },
    {
      id: 2,
      img: "assets/LMClogo.jpg",
      school: "La Martiniere College, Lucknow",
      date: "Apr 2015 - Mar 2019",
      grade: " 94.6%",
      //   desc: "I completed my class 10 education at Methodist School, Dankuni, where I studied Science with Computer Application.",
      degree: "10th ICSE",
    },
  ];

  const textRef = useRef(null);
  useEffect(() => {
    gsap.fromTo(
      textRef.current,
      { xPercent: -100 },
      {
        xPercent: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 170%", // Adjust this value as needed
          end: "bottom top",
          scrub: true,
          //   markers: true,
        },
      }
    );
  }, []);

  return (
    <div className=" w-[92%] mx-auto mt-20 md:mt-40" id="education">
      <div>
        <div ref={textRef}>
          <p className="uppercase text-3xl md:text-6xl text-center md:text-left mb-10  font-bold">
            My <span className="text-[#CBACF9]">Education</span>{" "}
          </p>
        </div>

        <VerticalTimeline>
          {education.map((education, index) => (
            <EducationCard key={`education-${index}`} education={education} />
          ))}
        </VerticalTimeline>
      </div>
    </div>
  );
};

export default Education;
