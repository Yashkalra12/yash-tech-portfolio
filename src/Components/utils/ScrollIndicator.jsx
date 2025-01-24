import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function ScrollIndicator({ children }) {
    const scrollIndicator = useRef(null);

    useEffect(() => {        
        let ctx = gsap.context(() => {
            gsap.to(scrollIndicator.current, {
                yPercent: -100,
                opacity: 0,
                duration: 1,
                delay: 0,
                ease: "power4.in",
                scrollTrigger: {
                    trigger: scrollIndicator.current,
                    start: "top 90%",
                    end: "bottom top",
                    // scrub: true,
                    // markers: true
                }
            });
        }); 
        
        return () => ctx.revert(); // Cleanup
    }, []);

    return (
        <div ref={scrollIndicator} className="flex flex-col justify-center items-center translate-y-[10vh]">
            {children}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="36" viewBox="0 0 16 36" fill="none" className="scale-150 -mt-4">
                <path d="M2 28L8 34L14 28" stroke="currentColor" strokeWidth="2"/>
            </svg>
        </div>
    );
}
