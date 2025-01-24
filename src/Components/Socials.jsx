import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Socials() {
  const cardClass =
    "rounded-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center font-bold text-xl [&>*]:scale-75 md:[&>*]:scale-100 shadow-lg hover:shadow-xl";

  const refs = Array(10)
    .fill(0)
    .map(() => useRef(null));
  const textRef = useRef(null);


    useEffect(() => {
        gsap.fromTo(
          textRef.current,
          { xPercent: -100 },
          {
            xPercent: 5,
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

  return (
    <div
      className="flex flex-col justify-between overflow-x-hidden mt-28"
      id="contact"
    >
      <div ref={textRef}>
        <p className="uppercase text-3xl md:text-6xl text-center md:text-left mb-10  font-bold">
          My <span className="text-[#CBACF9]">Profiles</span>{" "}
        </p>
      </div>
      <div className={`md:grow flex flex-col container p-5 min-h-48 mx-auto gap-5`}>
        <div className={`md:grow-[1] flex flex-wrap gap-5`}>
          <a
            target="_blank"
            href="https://www.linkedin.com/in/yashkalra12/"
            ref={refs[0]}
            className={`${cardClass} bg-[#0A66C2] text-white w-16 grow hover:grow-[1.5]`}
          >
            <img src="socials/linkedin.png" className="w-20" alt="" />
          </a>
          <a
            target="_blank"
            href="https://leetcode.com/u/yashkalra12/"
            ref={refs[1]}
            className={`${cardClass} bg-gradient-to-br from-slate-100 to-yellow-100 text-white w-16 grow hover:grow-[1.5]`}
          >
            <img src="socials/lc.webp" className="w-20" alt="" />
          </a>
          <a
            target="_blank"
            href="https://github.com/Yashkalra12"
            ref={refs[2]}
            className={`${cardClass} bg-[#24292F] text-white w-16 grow hover:grow-[1.5]`}
          >
            <img src="socials/github.png" className="w-20" alt="" />
          </a>
          <a
            target="_blank"
            href="https://wa.me/919118079005?text=Hey%20Yash!%20I%20came%20here%20from%20your%20portfolio"
            ref={refs[6]}
            className={`${cardClass} bg-green-500 text-white w-16 grow hover:grow-[1.5]`}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
              className="w-20"
              alt=""
            />
          </a>
          <a
            target="_blank"
            href="https://mail.google.com/mail/?view=cm&fs=1&to=yashkalra2013@gmail.com&su=Hello%20Yash&body=I%20came%20here%20from%20your%20portfolio"
            ref={refs[7]}
            className={`${cardClass} bg-slate-100 text-white w-16 grow hover:grow-[1.5]`}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
              className="w-20"
              alt=""
            />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Socials;
