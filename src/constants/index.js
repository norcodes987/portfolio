import {
    mobile,
    backend,
    creator,
    web,
    javascript,
    typescript,
    html,
    css,
    reactjs,
    redux,
    tailwind,
    nodejs,
    mongodb,
    git,
    figma,
    docker,
    ibm,
    mci,
    hpe,
    nex10,
    carrent,
    jobit,
    tripguide,
    threejs,
  } from "../assets";
  
  export const navLinks = [
    {
      id: "about",
      title: "About",
    },
    {
      id: "work",
      title: "Work",
    },
    {
      id: "contact",
      title: "Contact",
    },
  ];
  
  const services = [
    {
      title: "Web Developer",
      icon: web,
    },
    {
      title: "Mobile Developer",
      icon: mobile,
    },
    {
      title: "Backend Developer",
      icon: backend,
    },
    {
      title: "DevOps Engineer",
      icon: creator,
    },
  ];
  
  const technologies = [
    {
      name: "HTML 5",
      icon: html,
    },
    {
      name: "CSS 3",
      icon: css,
    },
    {
      name: "JavaScript",
      icon: javascript,
    },
    {
      name: "TypeScript",
      icon: typescript,
    },
    {
      name: "React JS",
      icon: reactjs,
    },
    {
      name: "Redux Toolkit",
      icon: redux,
    },
    {
      name: "Tailwind CSS",
      icon: tailwind,
    },
    {
      name: "Node JS",
      icon: nodejs,
    },
    {
      name: "MongoDB",
      icon: mongodb,
    },
    {
      name: "Three JS",
      icon: threejs,
    },
    {
      name: "git",
      icon: git,
    },
    {
      name: "figma",
      icon: figma,
    },
    {
      name: "docker",
      icon: docker,
    },
  ];
  
  const experiences = [
    {
      title: "Assistant Manager (HR Analytics and Performance Management)",
      company_name: "Ministry of Communications and Information",
      icon: mci,
      iconBg: "#ffffff",
      date: "May 2020 - Aug 2021",
      points: [
        "Automated manual ranking process through the use of Excel VBAs",
        "Optimised hiring procedures through the use of Python, VBA and RPA bots",
        "Played a key role in facilitating the change management process for the introduction of an innovative performance management system, impacting over 600 employees positively.",
      ],
    },
    {
      title: "Digital Transformation Program Analyst",
      company_name: "Hewlett Packard Enterprise",
      icon: hpe,
      iconBg: "#E6DEDD",
      date: "Aug 2021 - Apr 2022",
      points: [
        "Part of the digital team leading a project to integrate HPE’s global operations internal and external data into one platform with Hyperledger tracking",
        "Responsible for creating Business Requirement Documents"
      ],
    },
    {
      title: "Fullstack Blockchain Engineer",
      company_name: "Nex10 Labs",
      icon: nex10,
      iconBg: "#ffffff",
      date: "Mar 2022 - Jun 2022",
      points: [
        "Fullstack developer for Uninterested Unicorns collection",
        "Fullstack developer for NFT Marketplace and 3D Voxel collection for Uninterested Unicorns",
        "Collaborated with 3D artists and blockchain experts to incorporate innovative features, such as unique NFT attributes and decentralized storage solutions",
      ],
    },
    {
      title: "Application Developer",
      company_name: "IBM",
      icon: ibm,
      iconBg: "#E6DEDD",
      date: "Jul 2022 - Present",
      points: [
        "Frontend Developer for MINDEF mobile application",
        "Led the project through multiple stages, from initial pilot to subsequent full-scale delivery releases. Both the mobile app and the admin web portal are now successfully deployed nationwide.",
        "Applied Scrum and Agile methodologies to efficiently manage and deliver project",
        "Post production support through upgrading AWS AMI and bug fixing",
      ],
    },
  ];

  const techItems = [
    {tech_name: 'React', tech_color: "#00D1F7"},
    {tech_name: 'React Native', tech_color: "#FFFFFF"},
    {tech_name: 'Spring Boot', tech_color: "#ff00f6"},
    {tech_name: 'MySQL', tech_color: "#f35d40"},
    {tech_name: 'AWS', tech_color: "#0AE448"},
  ]
  
  const testimonials = [
    {
      testimonial:
        "I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.",
      name: "Sara Lee",
      designation: "CFO",
      company: "Acme Co",
      image: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
      testimonial:
        "I've never met a web developer who truly cares about their clients' success like Rick does.",
      name: "Chris Brown",
      designation: "COO",
      company: "DEF Corp",
      image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
      testimonial:
        "After Rick optimized our website, our traffic increased by 50%. We can't thank them enough!",
      name: "Lisa Wang",
      designation: "CTO",
      company: "456 Enterprises",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
    },
  ];
  
  const projects = [
    {
      name: "Car Rent",
      description:
        "Web-based platform that allows users to search, book, and manage car rentals from various providers, providing a convenient and efficient solution for transportation needs.",
      tags: [
        {
          name: "react",
          color: "blue-text-gradient",
        },
        {
          name: "mongodb",
          color: "green-text-gradient",
        },
        {
          name: "tailwind",
          color: "pink-text-gradient",
        },
      ],
      image: carrent,
      source_code_link: "https://github.com/",
    },
    {
      name: "Job IT",
      description:
        "Web application that enables users to search for job openings, view estimated salary ranges for positions, and locate available jobs based on their current location.",
      tags: [
        {
          name: "react",
          color: "blue-text-gradient",
        },
        {
          name: "restapi",
          color: "green-text-gradient",
        },
        {
          name: "scss",
          color: "pink-text-gradient",
        },
      ],
      image: jobit,
      source_code_link: "https://github.com/",
    },
    {
      name: "Trip Guide",
      description:
        "A comprehensive travel booking platform that allows users to book flights, hotels, and rental cars, and offers curated recommendations for popular destinations.",
      tags: [
        {
          name: "nextjs",
          color: "blue-text-gradient",
        },
        {
          name: "supabase",
          color: "green-text-gradient",
        },
        {
          name: "css",
          color: "pink-text-gradient",
        },
      ],
      image: tripguide,
      source_code_link: "https://github.com/",
    },
  ];
  
  export { services, technologies, experiences, techItems, testimonials, projects };