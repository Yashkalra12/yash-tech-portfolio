import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Tilt } from "react-tilt";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import MagicButton from "./utils/MagicButton";
import { FiGithub } from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa6";

const Contacts = () => {
  const textRef = useRef(null);
  useEffect(() => {
    gsap.fromTo(
      textRef.current,
      { xPercent: -100 },
      {
        xPercent: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 180%", // Adjust this value as needed
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }, []);

  const Contacts = [
    { img: "html.png", title: "HTML" },
    { img: "css.png", title: "CSS" },
    { img: "tailwind.svg", title: "Tailwind CSS" },
    { img: "js.png", title: "JavaScript" },
    { img: "react.png", title: "React" },
    { img: "reactquery.png", title: "React Query" },
    { img: "redux.png", title: "Redux" },
    { img: "zustand.svg", title: "Zustand" },
    { img: "node.png", title: "Node.js" },
    { img: "express.jpg", title: "Express.js" },
    { img: "mongo.png", title: "MongoDB" },
    { img: "git.png", title: "Git" },
    { img: "github.png", title: "GitHub" },
  ]

  return (
    <div className="w-[92%] mx-auto mt-20 md:mt-40 " id="Contacts">
      <p
        ref={textRef}
        className="uppercase text-3xl md:text-6xl text-center md:text-left  font-bold"
      >
        My Profiles & <span className="text-[#CBACF9]">Contacts</span>{" "}
      </p>

      <div className="flex flex-wrap justify-center gap-10 mt-10">
        {Contacts.map((skill) => (
          <Tilt className="flex gap-4 justify-center items-center border rounded-xl px-10 py-3 hover:bg-indigo-950 ease-out duration-500">
            <img src={`Contacts/${skill.img}`} alt="" className="w-14" />
            <p className="font-semibold text-xl">{skill.title}</p>
          </Tilt>
        ))}
      </div>
      <div className="flex items-center">
        <p className="text-4xl font-bold">Coding Profiles : </p>


        <Tilt options={{ max: 15, scale: 1 }} className="my-20 w-[40rem] mx-auto">
          <img src="https://codolio.com/profile/yashkalra12/card" alt="" className="w-full my-5" />
        </Tilt>
      </div>
    </div>
  )
}

export default Contacts
