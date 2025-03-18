// import React, { useEffect, useRef } from "react";
// import { gsap } from "gsap";
// import { Tilt } from "react-tilt";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { Link } from "react-router-dom";
// import MagicButton from "./utils/MagicButton";
// import { FiGithub } from "react-icons/fi";
// import { FaLocationArrow } from "react-icons/fa6";

// const Skills = () => {
//   const textRef = useRef(null);
//   useEffect(() => {
//     gsap.fromTo(
//       textRef.current,
//       { xPercent: -100 },
//       {
//         xPercent: 0,
//         duration: 1,
//         ease: "power2.out",
//         scrollTrigger: {
//           trigger: textRef.current,
//           start: "top 180%", // Adjust this value as needed
//           end: "bottom top",
//           scrub: true,
//         },
//       }
//     );
//   }, []);

//   const skills= [
//     {img:"html.png",title:"HTML"},
//     {img:"css.png",title:"CSS"},
//     {img:"tailwind.svg",title:"Tailwind CSS"},
//     {img:"js.png",title:"JavaScript"},
//     {img:"react.png",title:"React"},
//     {img:"reactquery.png",title:"React Query"},
//     {img:"redux.png",title:"Redux"},
//     {img:"zustand.svg",title:"Zustand"},
//     {img:"node.png",title:"Node.js"},
//     {img:"express.jpg",title:"Express.js"},
//     {img:"mongo.png",title:"MongoDB"},
//     {img:"git.png",title:"Git"},
//     {img:"github.png",title:"GitHub"},
//   ]

//   return (
//     <div className="w-[98%] md:w-[92%] mx-auto mt-20 md:mt-40 " id="skills">
//       <p
//         ref={textRef}
//         className="uppercase text-3xl md:text-6xl text-center md:text-left  font-bold"
//       >
//         Technical <span className="text-[#CBACF9]">Skills</span>{" "}
//       </p>

//       <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 mx-2">
//         {skills.map((skill) => (
//             <Tilt className="flex gap-4 justify-center items-center border rounded-xl w-[25vw] h-24 md:w-52  hover:bg-indigo-950 ease-out duration-500">
//             <img src={`skills/${skill.img}`} alt="" className="w-14" />
//             <p className="font-semibold text-xl hidden sm:block ">{skill.title}</p>
//             </Tilt>
//         ))}
//       </div>
//       <div className="flex md:flex-row flex-col items-center mt-10">
//         <p className="text-lg md:text-4xl font-bold md:ml-20">LeetCode Profile : </p>


//       <Tilt options={{ max: 15,scale:1}} className="my-20w-[70vw] md:w-[40rem] mx-auto">
//         <img src="https://leetcard.jacoblin.cool/yashkalra12?theme=dark&font=Special%20Elite&ext=heatmap" alt="" className="w-full my-5" />
//       </Tilt>
//       </div>
//     </div>
//   )
// }

// export default Skills



import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Tilt } from "react-tilt";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Skills = () => {
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
          start: "top 180%", // Adjust this value as needed
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }, []);

  const skills = [
    { img: "html.png", title: "HTML" },
    { img: "css.png", title: "CSS" },
    { img: "tailwind.svg", title: "Tailwind CSS" },
    { img: "js.png", title: "JavaScript" },
    { img: "react.png", title: "React" },
    { img: "reactquery.png", title: "React Query" },
    { img: "redux.png", title: "Redux" },
    { img: "zustand.svg", title: "Zustand" },
    { img: "Typescript.png", title: "TypeScript" },
    { img: "node.png", title: "Node.js" },
    { img: "express.jpg", title: "Express.js" },
    { img: "mongo.png", title: "MongoDB" },
    { img: "git.png", title: "Git" },
    { img: "github.png", title: "GitHub" },
  ];

  return (
    <div className="w-[98%] md:w-[92%] mx-auto mt-20 md:mt-40" id="skills">
      <p
        ref={textRef}
        className="uppercase text-3xl md:text-6xl text-center md:text-left font-bold"
      >
        Technical <span className="text-[#CBACF9]">Skills</span>
      </p>

      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 mx-2">
        {skills.map((skill) => (
          <Tilt
            key={skill.title}
            className="flex gap-4 justify-center items-center border rounded-xl w-[25vw] h-24 md:w-52 hover:bg-indigo-950 ease-out duration-500"
          >
            <img src={`skills/${skill.img}`} alt="" className="w-14" />
            <p className="font-semibold text-xl hidden sm:block">{skill.title}</p>
          </Tilt>
        ))}
      </div>

      <div className="flex flex-row items-center justify-center mt-10 space-x-6">
  <p className="text-lg md:text-4xl font-bold">Coding Profile Card:</p>

  <div className="flip-card w-[300px] h-[400px] perspective">
    {/* Card Container */}
    <div className="relative w-full h-full transition-transform duration-1000 transform-style-3d hover:rotate-y-180">
      {/* Front Side */}
      <div className="absolute h-full backface-hidden">
        <div className=" h-full rounded-xl shadow-2xl overflow-hidden">
          <img
            src="/skills/front.png"
            alt="Front card"
            className="h-full object-cover"
          />
        </div>
      </div>

      {/* Back Side */}
      <div className="absolute h-full backface-hidden rotate-y-180">
        <div className=" h-full rounded-xl shadow-2xl overflow-hidden">
          <img
            src="/skills/back.png"
            alt="Back card"
            className=" h-full object-cover"
          />
        </div>
      </div>
    </div>
  </div>

      </div>
    </div>
  );
};

export default Skills;













//  Flip Card for LeetCode Profile
//         <div className="my-20 w-[90vw] md:w-[30rem] mx-auto group perspective">
//           <div className="relative w-full h-[42rem] transform-style-preserve-3d transition-transform duration-700 group-hover:rotate-y-180">
//             {/* Front Side */}
//             <div className="absolute h-full backface-hidden">
//               <img
//                 src="/skills/front.png"
//                 alt="LeetCode Front"
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             </div>
//             {/* Back Side */}
//             <div className="absolute h-full rotate-y-180 backface-hidden">
//               <img
//                 src="/skills/back.png"
//                 alt="LeetCode Back"
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             </div>
//           </div>
//         </div>  
