import React, { useEffect, useRef } from "react";
import MagicButton from "../Components/utils/MagicButton";
import { FaLocationArrow } from "react-icons/fa6";
import { FiDownloadCloud } from "react-icons/fi";
import { motion } from "framer-motion";
import AnimatedText from "../Components/utils/AnimatedText";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ParallaxBG from "../Components/utils/ParallaxBG";
import AboutMe from "../Components/AboutMe";
import Projects from "../Components/Projects";
import Experience from "../Components/Experience";
import Skills from "../Components/Skills";
import Socials from "../Components/Socials";
import Education from "../Components/Education";
import { Link } from "react-router-dom";
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useEffect(() => {
    let ctx = gsap.context(() => {
      heroTextRef.forEach((ref, index) => {
        if (!ref.current) return;
        gsap.from(ref.current, {
          y: -200,
          opacity: 0,
          ease: "power4.out",
          duration: 4,
          delay: 0.5 + index * 0.25,
        });
      });
    });

    return () => ctx.revert(); // cleanup!
  }, []);

  const heroTextRef = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const aboutMeRef = useRef(null);

  return (
    <div className="" id="home">
      <div className="relative z-10 -mb-20 w-[95%] mx-auto">
        <ParallaxBG>
          <p
            ref={heroTextRef[3]}
            className="font-spacemono text-lg md:text-3xl text-center mt-56 mx-auto"
          >
           A developer's journey through projects, code and passion.
          </p>

          <div className="flex flex-col justify-center items-center my-16 z-10">
            <div ref={heroTextRef[2]} className="overflow-y-clip">
              <h1 className="text-xl md:text-3xl opacity-75 font-bold font-spacemono ">
                Hey, I am
              </h1>
            </div>
            <div ref={heroTextRef[1]} className="overflow-y-clip">
              <h1 className="text-3xl md:text-7xl font-bold uppercase text-[#CBACF9]">
                <AnimatedText delay={200} text="YASH KALRA" />
              </h1>
            </div>
          </div>

          <div ref={heroTextRef[0]} className="flex gap-3 md:gap-10 justify-center mx-auto">
            <a href="https://drive.google.com/file/d/1xurERMv5qe7o54uPjougjTSEg4dmQ5hW/view?usp=sharing" target="_blank" className="md:w-44">
            <MagicButton
              title="Resume"
              icon={<FiDownloadCloud size={20} />}
              position="right"
              otherClasses="font-semibold"
        
            />
            </a>
            <a href="#contact" className="md:w-44">

            <MagicButton
              title="Contact Me"
              icon={<FaLocationArrow size={20} />}
              position="right"
              otherClasses={" font-semibold whitespace-nowrap"}
            />
            </a>
          </div>
        </ParallaxBG>
      </div>
      <AboutMe sectionRef={aboutMeRef} />
      <Experience />
      <Projects />
      <Skills />
      <Education />
      <Socials />
      <div className="h-48">

      </div>
      <img
        src="assets/grid-pattern.png"
        className="absolute top-0 mx-auto w-full "
      />
      <img src="assets/spotlight-1.png" className="absolute w-[50vw] top-0" />
      <img
        src="assets/spotlight.png"
        className="absolute w-[50vw] top-0 right-0"
      />
    </div>
  );
};

export default Home;
