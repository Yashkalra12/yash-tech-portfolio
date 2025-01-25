import React,{useEffect,useRef} from "react";
import ProjectCard from "./ProjectCard";
import { Tilt } from "react-tilt";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
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
  const projects = [
    {
      image: "gignest.png",
      title: "GigNest",
      desc: "GigNest connects skilled freelancers with clients seeking top-notch services, offering a seamless platform for freelancers to showcase their talents and clients to find experts.",
      link: "https://gig-nest.vercel.app/",
      github: "https://github.com/Yashkalra12/GigNest",
      skills: [{title:"React",img:"react.png"},{title:"Zustand",img:"zustand.svg"},{title:"Tailwind CSS",img:"tailwind.svg"},{title:"MUI",img:"mui.png"},{title:"Node.js",img:"node.png"},{title:"Express.js",img:"express.jpg"},{title:"MongoDB",img:"mongo.png"}],
    },
    {
      image: "evoting.png",
      title: "Evoting Platform",
      desc: "Developed an advanced eVoting System built using the MERN stack (MongoDB, Express, React, Node.js) to revolutionize the voting process by ensuring accessibility, transparency, and security for all users.",
      link: "https://evoting-mern-frontend.vercel.app/",
      github: "https://github.com/Yashkalra12/Evoting-mern",
      skills: [{title:"React",img:"react.png"},{title:"Tailwind CSS",img:"tailwind.svg"},{title:"Node.js",img:"node.png"},{title:"Express.js",img:"express.jpg"},{title:"MongoDB",img:"mongo.png"}],
    },
    {
      image: "healthsync.png",
      title: "HealthSync",
      desc: "HealthSync offers a seamless experience for users and doctors alike. Sign up or log in to unlock a range of features. Easily browse through a list of available doctors, manage your profile, and submit queries effortlessly.",
      link: "https://health-sync-rose.vercel.app/",
      github: "https://github.com/Yashkalra12/HealthSync",
      skills: [{title:"React",img:"react.png"},{title:"Redux",img:"redux.png"},{title:"Tailwind CSS",img:"tailwind.svg"},{title:"JavaScript",img:"js.png"},{title:"Node.js",img:"node.png"},{title:"Express.js",img:"express.jpg"},{title:"MongoDB",img:"mongo.png"}],
    },
  ];
  return (
    <div className="w-[92%] mx-auto mt-20" id="projects">
      <p ref={textRef} className="uppercase text-3xl md:text-6xl text-center md:text-left font-bold">
        Personal <span className="text-[#CBACF9]">Projects</span>{" "}
      </p>
      <div className="flex flex-wrap gap-10 mt-10 justify-center" data-aos="fade-up">
        {projects.map((project) => (
          <Tilt options={{ max: 15,scale:1}}>
            <ProjectCard
              title={project.title}
              desc={project.desc}
              image={project.image}
              github={project.github}
              link={project.link}
              skills={project.skills}
            />
          </Tilt>
        ))}
      </div>
    </div>
  );
};

export default Projects;
