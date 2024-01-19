import React, {useRef, useState} from "react";
import {Tilt}  from 'react-tilt'
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn, textVariant } from "../utils/motion";

const ProjectCard = ({
  name,
  description,
  tags,
  image,
  source_code_link,
}) => {
  return (
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full'
      >
        <div className='relative w-full h-[230px] cursor-pointer'
          onClick={() => window.open(source_code_link, "_blank")}
        >
          <img
            src={image}
            alt='project_image'
            className='w-full h-full object-cover rounded-2xl'
          />

          <div className='absolute inset-0 flex justify-end m-3 card-img_hover'>
            <div
              className='black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer'
            >
              <img
                src={github}
                alt='source code'
                className='w-1/2 h-1/2 object-contain'
              />
            </div>
          </div>
        </div>

        <div className='mt-5'>
          <h3 className='text-white font-bold text-[24px]'>{name}</h3>
          <p className='mt-2 text-secondary text-[14px]'>{description}</p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <p
              key={`${name}-${tag.name}`}
              className={`text-[14px] ${tag.color}`}
            >
              #{tag.name}
            </p>
          ))}
        </div>
      </Tilt>
  );
};

const Works = () => {
  const [data,setData] = useState(projects);
  const [selectedButton, setSelectedButton] = useState('All');

  const ref = useRef();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "start start"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const gallery_filter = (type) => {
    setSelectedButton(type);
    if (type === 'All') {
      setData(projects);
    } else {
      const filteredProjects = projects.filter((project) => project.type === type);
      setData(filteredProjects);
    }
  };


  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
      </motion.div>

      <div className='w-full flex' ref={ref}>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          The following projects showcases my skills and experience through
          real-world examples of my work. Each project is briefly described with
          links to code repositories. It reflects my ability to solve complex problems, 
          work with different technologies,
          and manage projects effectively.
        </motion.p>
      </div>
     
      <div className="mt-20">
          <ul className="flex items-center justify-center list-none gap-4 mb-30">
            <li>
              <button 
                onClick={() => gallery_filter('All')}
                className={`${
                  selectedButton === 'All' ? 'bg-blue-500' : 'bg-none'
                } text-white py-2 px-5 uppercase border-navajowhite text-lg rounded-full`}
              >All
              </button>
            </li>
            {[...new Set(projects.map((project) => project.type))].map((item) => (
              <li key={item}>
                <button
                  onClick={() => gallery_filter(item)}
                  className={`${
                    selectedButton === item ? 'bg-blue-500' : 'bg-none'
                  } text-white py-2 px-5 uppercase border-navajowhite text-lg rounded-full`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <motion.div style={{ scaleX}} className="h-2 bg-white mt-5"></motion.div>
      <div className='mt-10 flex flex-wrap gap-7 sm:items-center'>
        {data.map((project, index) => (
          <ProjectCard key={`project-${index}`} index={index} {...project} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(Works, "");