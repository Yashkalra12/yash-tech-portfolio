import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollIndicator from "./utils/ScrollIndicator";
import useIntersectionObserver from "../Hooks/UseInterSectionObsever";

gsap.registerPlugin(ScrollTrigger);

export default function AboutMe({ sectionRef }) {
  const aboutme = "ABOUT ME ABOUT ME ABOUT ME ABOUT ME ABOUT ME";
  const name = "YASH KALRA YASH KALRA YASH KALRA YASH KALRA YASH KALRA";
  const skills =
    "FULL STACK DEVELOPER DSA ENTHUSIAST GRAPHIC DESIGNER VIDEO EDITOR";
  const skills2 =
    "GRAPHIC DESIGNER VIDEO EDITOR FULL STACK DEVELOPER DSA ENTHUSIAST";

  const parentRef = useRef(null);
  const refs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const insideRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const MeRef = [useRef(null), useRef(null)];
  const imageRef = useRef(null);

  const tagsRef = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    let ctx = gsap.context(() => {
      refs.forEach((ref, index) => {
        gsap.fromTo(
          ref.current,
          {
            xPercent: -5 - 2 * index,
          },
          {
            xPercent: 0,
            scrollTrigger: {
              trigger: parentRef.current,
              start: "top 150%",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
      insideRefs.forEach((ref, index) => {
        gsap.from(ref.current, {
          xPercent: -10,
          yPercent: 100,
          opacity: 0,
          delay: 0.35 * index,
          ease: "power4.out",
          duration: 2,
          scrollTrigger: {
            trigger: MeRef[0].current,
            start: "top 150%",
          },
        });
      });

      gsap.from(MeRef[0].current, {
        yPercent: 100,
        opacity: 0,
        duration: 2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: MeRef[0].current,
          start: "top 150%",
          end: "bottom top",
        },
      });
      gsap.fromTo(
        MeRef[1].current,
        {
          yPercent: 100,
          opacity: 0,
        },
        {
          yPercent: 0,
          duration: 2,
          delay: 0.5,
          opacity: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: MeRef[1].current,
            start: "top 150%",
            end: "bottom top",
          },
        }
      );
      gsap.from(imageRef.current, {
        yPercent: 100,
        duration: 2,
        delay: 0.5,
        ease: "power4.out",
        scrollTrigger: {
          trigger: MeRef[0].current,
          start: "top 150%",
          end: "bottom top",
        },
      });

      tagsRef.forEach((ref, index) => {
        gsap.from(ref.current, {
          yPercent: 100,
          opacity: 0,
          ease: "power2.out",
          delay: index * 0.25,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 150%",
            end: "bottom top",
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  let isIntersecting = useIntersectionObserver(imageRef, { threshold: 0.7 });

  return (
    <div ref={sectionRef} className="relative z-20" id="about">
      <div className="overflow-x-clip 2xl:-mb-[27rem] xl:-mb-[15rem] lg:-mb-[4rem] ">
        <div ref={parentRef} className="w-max">
          <div ref={refs[0]} className="overflow-y-clip">
            <h3
              ref={insideRefs[0]}
              className="md:text-xl tracking-[8px] md:tracking-[30px] font-bold"
            >
              {aboutme}
            </h3>
          </div>
          <div ref={refs[1]} className="overflow-y-clip">
            <h3
              ref={insideRefs[1]}
              className="mt-4 text-2xl md:text-7xl font-bold"
            >
              {name}
            </h3>
          </div>
          <div ref={refs[2]} className="overflow-y-clip">
            <h3
              ref={insideRefs[2]}
              className=" text-2xl md:text-7xl font-bold opacity-75"
            >
              {skills}
            </h3>
          </div>
          <div ref={refs[3]} className="overflow-y-clip">
            <h3
              ref={insideRefs[3]}
              className=" text-2xl md:text-7xl font-bold opacity-50"
            >
              {skills2}
            </h3>
          </div>
          <div ref={refs[4]} className="overflow-y-clip">
            <h3
              ref={insideRefs[4]}
              className="mt-4 md:text-xl tracking-[8px] md:tracking-[30px] font-extrabold"
            >
              {aboutme}
            </h3>
          </div>
        </div>
      </div>
      <div className="md:container md:mx-auto flex flex-col-reverse md:flex-row items-end gap-8 px-8 py-10 mt-[3vw]">
        <div className="w-full lg:w-3/4">
          <div className="overflow-y-clip">
            <h1 ref={MeRef[0]} className="text-xl sm:text-5xl font-extrabold ">
              YASH <span className="text-[#CBACF9]">KALRA</span>
            </h1>
          </div>
          <hr className="border-primary border-2 mt-4" />
          <div className="mt-4 flex flex-wrap gap-1">
            {[
              "Full Stack Developer",
              "Problem Solver(DSA)",
              "Graphic Designer",
              "Video Editor",
            ].map((value, index) => (
              <div
                key={index}
                ref={tagsRef[index]}
                className="cursor-pointer fill-hover relative grow border-2 border-white/10 rounded-lg flex p-2 lg:p-4 justify-center hover:grow-[2] transition-[flex-grow] duration-300 text-sm hover:bg-gray-900"
              >
                <span>{value}</span>
              </div>
            ))}
          </div>
          <p
            ref={MeRef[1]}
            className="text-justify mt-6 text-xs font-light md:text-base mb-4"
          >
            I'm Yash Kalra, a final-year B.Tech CSE student at CUIET,
            specializing in full-stack development using the MERN stack. With a
            strong grasp of Data Structures and Algorithms, I excel in building
            dynamic web applications and solving complex coding challenges,
            continuously exploring new technologies to enhance my skills.
          </p>
        </div>
        <div className="w-full md:w-1/2 overflow-y-clip">
          <div className="group" ref={imageRef}>
            <img
              className={`absolute top-0 left-0 z-10 w-full h-full duration-700 ${
                isIntersecting ? "opacity-0" : ""
              }`}
              src="assets/ME.png"
              alt=""
            />
            <img
              className="w-full h-full white-outline"
              src="/assets/ME.png"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}
