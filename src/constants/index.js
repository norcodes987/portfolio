import {
    mobile,
    backend,
    creator,
    web,
    ibm,
    mci,
    hpe,
    nex10,
    libraryapp,
    jobit,
    tripguide,
  } from "../assets";
  
  export const navLinks = [
    {
      id: "experience",
      title: "Experience",
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
  
  
  const projects = [
    {
      name: "Library App",
      type: 'Full Stack',
      description:
        "Library App is a full stack React/Spring Book app with dual user-admin portal. It allows users to reserve and return library books and admins to create, edit and delete books.",
      tags: [
        {
          name: "react",
          color: "blue-text-gradient",
        },
        {
          name: "springboot",
          color: "green-text-gradient",
        },
        {
          name: "okta",
          color: "pink-text-gradient",
        },
        {
          name: "stripe",
          color: "orange-text-gradient",
        },
      ],
      image: libraryapp,
      source_code_link: "https://github.com/norcodes987/library_app/tree/main",
    },
    {
      name: "Job IT",
      type: 'Dev Ops',
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
      type: 'Scripting',
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
  
  export { services, experiences, techItems, projects };