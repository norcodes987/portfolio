import React, { useLayoutEffect, useRef } from "react";
import {motion} from 'framer-motion'
import {textVariant} from '../utils/motion'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {techItems} from '../constants'
import {styles} from '../styles'

const Tech = () => {
  const component = useRef(null);
  gsap.registerPlugin(ScrollTrigger);

 

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // create as many GSAP animations and/or ScrollTriggers here as you want...
      const tl = gsap.timeline({
        scrollTrigger: {
          pin: true, // pin the trigger element while active
          start: "top bottom",
          end: "bottom top",
          scrub: 4,
        },
      });

      tl.fromTo(
        ".tech-row",
        {
          x: (index) => {
            return index % 2 === 0
              ? gsap.utils.random(600, 400)
              : gsap.utils.random(-600, -400);
          },
        },
        {
          x: (index) => {
            return index % 2 === 0
              ? gsap.utils.random(-600, -400)
              : gsap.utils.random(600, 400);
          },
          ease: "power1.inOut",
        },
      );
    }, component);
    return () => ctx.revert(); // cleanup!
  }, []);


  return (
    <section className="overflow-hidden" ref={component}>
     
        <motion.div variants={textVariant()} className={`${styles.padding} max-w-7xl mx-auto relative z-0`}>
        <p className={styles.sectionSubText}>What I use</p>
        <h2 className={styles.sectionHeadText}>Technologies.</h2>
      </motion.div>
   
     
      <div>
        {techItems.map((tech, index) => (
          <div
            key={index}
            className="tech-row mb-8 flex items-center justify-center gap-4 text-slate-700"
            aria-label={tech.tech_name || ""}
          >
            {Array.from({ length: 15 }, (_, index) => (
              <React.Fragment key={index}>
                <span
                  className={"tech-item text-8xl font-extrabold uppercase tracking-tighter"}
                  style={{
                    color: index === 7 && tech.tech_color ? tech.tech_color : "inherit",
                  }}
                >
                  {tech.tech_name}
                </span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Tech;