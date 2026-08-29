/**
 * Single source of truth for everything about Yash.
 *
 * The UI, the RAG terminal knowledge base and `public/llms.txt` are all
 * generated from this file. Edit here, and everything downstream follows.
 * (Run `npm run llms` after editing to regenerate public/llms.txt.)
 */

export const identity = {
  name: "Yash Kalra",
  firstName: "Yash",
  tagline: "Full Stack Developer",
  roles: [
    "Full Stack Developer",
    "AI App Builder",
    "React Engineer",
    "Everyday Learner",
    "Hybrid Athlete",
  ],
  headline: "CS Grad @ Chitkara · Full Stack + AI",
  blurb:
    "Hey there! I am Yash Kalra — a full stack developer who builds end-to-end AI-powered applications. I thrive in fast-paced teams and love shipping products that actually get used.",
  about: [
    "A driven full stack developer, everyday learner and hybrid athlete. I craft end-to-end AI-powered products, from the API layer up to the pixels.",
    "Over the last two years I have shipped 5+ production applications for US-based clients — AI stock-market analysers, document validation pipelines, and desktop software reborn as web apps.",
    "I am open to relocating anywhere in the world, and equally happy fully remote.",
  ],
  location: "Lucknow / Chandigarh, India",
  relocation: "Open to relocate worldwide · Remote ready",
  learning: ["LLM Application Integrations", "LangChain", "Retrieval-Augmented Generation"],
  offers: ["Web Apps", "Mobile Apps", "AI Solutions", "Cloud Services"],
  avatar: "/assets/ME.png",
  resume:
    "https://drive.google.com/file/d/19yrsgZsfgshgKRE0WSf7S-SuHAEyXJxM/view?usp=sharing",
};

export const socials = [
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "/in/yashkalra12",
    href: "https://www.linkedin.com/in/yashkalra12/",
    color: "#0A66C2",
  },
  {
    id: "github",
    label: "GitHub",
    handle: "@Yashkalra12",
    href: "https://github.com/Yashkalra12",
    color: "#24292F",
  },
  {
    id: "leetcode",
    label: "LeetCode",
    handle: "@yashkalra12",
    href: "https://leetcode.com/u/yashkalra12/",
    color: "#FFA116",
  },
  {
    id: "email",
    label: "Email",
    handle: "yashkalra2013@gmail.com",
    href: "mailto:yashkalra2013@gmail.com",
    color: "#EA4335",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    handle: "+91 91180 79005",
    href: "https://wa.me/919118079005?text=Hey%20Yash!%20I%20came%20here%20from%20your%20portfolio",
    color: "#25D366",
  },
];

/** Grouped skills — rendered as the draggable "Variable Skill Set" list. */
export const skillGroups = [
  ["Front End", "React, Next.js, Angular, Tailwind CSS"],
  ["Back End", "Node.js, Express, FastAPI, Django"],
  ["AI / LLM", "LangChain, RAG, OpenAI & Claude APIs"],
  ["Languages", "JavaScript, TypeScript, Python, C++"],
  ["Data & Infra", "MongoDB, SQL, Redux, Zustand, Git"],
];

/**
 * Flat skill list with logo files from `public/skills/`.
 *
 * `color` is each technology's own brand colour, used to tint its tile in the
 * scrolling marquee. Tinted rather than filled: eighteen saturated blocks in a row
 * fight each other, and a few of these brands (JavaScript yellow, GitHub black)
 * have no readable white-on-brand version anyway.
 */
export const skills = [
  { img: "html.png", title: "HTML", color: "#E34F26" },
  { img: "css.png", title: "CSS", color: "#1572B6" },
  { img: "tailwind.svg", title: "Tailwind CSS", color: "#06B6D4" },
  { img: "js.png", title: "JavaScript", color: "#F7DF1E" },
  { img: "Typescript.png", title: "TypeScript", color: "#3178C6" },
  { img: "python.png", title: "Python", color: "#3776AB" },
  { img: "react.png", title: "React", color: "#61DAFB" },
  { img: "reactquery.png", title: "React Query", color: "#FF4154" },
  { img: "redux.png", title: "Redux", color: "#764ABC" },
  { img: "zustand.svg", title: "Zustand", color: "#B8763E" },
  { img: "node.png", title: "Node.js", color: "#5FA04E" },
  { img: "express.jpg", title: "Express.js", color: "#4B5563" },
  { img: "django.png", title: "Django", color: "#0C4B33" },
  { img: "mongo.png", title: "MongoDB", color: "#47A248" },
  { img: "sql.png", title: "SQL", color: "#00758F" },
  { img: "postman.png", title: "Postman", color: "#FF6C37" },
  { img: "git.png", title: "Git", color: "#F05032" },
  { img: "github.png", title: "GitHub", color: "#181717" },
];

export const experience = [
  {
    id: "munshot",
    company: "Munshot PTE Ltd",
    shortName: "Munshot",
    role: "Full Stack Developer",
    duration: "Feb 2025 – Jan 2026",
    logo: "/assets/munsgot_logo.png",
    link: "https://www.linkedin.com/company/munshot/about/",
    highlights: [
      "Engineered an AI-based stock market analyser, developing and testing the core APIs behind it.",
      "Built the Analyst Agents screen from scratch, integrating 10+ APIs end to end — design through functionality.",
      "Shipped a Stocks Portfolio panel with toggle behaviour and Redux-backed stock listing, wired into existing screens.",
    ],
  },
  {
    id: "lumio",
    company: "Lumio AI",
    shortName: "Lumio AI",
    role: "Software Engineer",
    duration: "Sep 2024 – Feb 2025",
    logo: "/assets/LumioAi.png",
    link: "https://www.teamlumio.ai/",
    highlights: [
      "Built and deployed 5+ projects from scratch using React, Angular, Next.js and FastAPI.",
      "Integrated AI APIs and built the frontends for applications used by US-based clients.",
      "Ported desktop software to the web with Three.js, testing features with Pytest.",
      "Developed a flagging system in a monorepo that validated thousands of PDFs against ground-truth JSON, improving accuracy by 80%.",
    ],
  },
];

export const projects = [
  {
    id: "gignest",
    title: "GigNest",
    image: "/projects/gignest.png",
    src: "https://gig-nest.vercel.app/",
    github: "https://github.com/Yashkalra12/GigNest",
    description:
      "GigNest connects skilled freelancers with clients looking for top-notch services — a seamless marketplace for freelancers to showcase their talent and for clients to find experts.",
    stack: ["React", "Zustand", "Tailwind CSS", "MUI", "Node.js", "Express.js", "MongoDB"],
  },
  {
    id: "evoting",
    title: "eVoting Platform",
    image: "/projects/evoting.png",
    src: "https://evoting-mern-frontend.vercel.app/",
    github: "https://github.com/Yashkalra12/Evoting-mern",
    description:
      "An advanced eVoting system on the MERN stack that reimagines the voting process around accessibility, transparency and security for every voter.",
    stack: ["React", "Tailwind CSS", "Node.js", "Express.js", "MongoDB"],
  },
  {
    id: "healthsync",
    title: "HealthSync",
    image: "/projects/healthsync.png",
    src: "https://health-sync-rose.vercel.app/",
    github: "https://github.com/Yashkalra12/HealthSync",
    description:
      "HealthSync gives patients and doctors one shared surface: browse available doctors, manage your profile and submit queries, all behind a proper auth flow.",
    stack: ["React", "Redux", "Tailwind CSS", "JavaScript", "Node.js", "Express.js", "MongoDB"],
  },
];

export const education = [
  {
    id: "chitkara",
    school: "Chitkara University Institute of Engineering and Technology",
    place: "Punjab, India",
    degree: "B.E. Computer Science and Engineering",
    date: "Oct 2021 – Jul 2025",
    grade: "9.26 CGPA",
    logo: "/assets/CUIETlogo.png",
    desc: "Coursework across Data Structures, Algorithms, OOP, DBMS, Operating Systems and Computer Networks.",
  },
  {
    id: "cis",
    school: "City International School",
    place: "Lucknow, India",
    degree: "Class 12 — Science with Computer Science",
    date: "Apr 2019 – Mar 2021",
    grade: "91.6%",
    logo: "/assets/CISlogo.jpg",
    desc: "",
  },
  {
    id: "lmc",
    school: "La Martiniere College",
    place: "Lucknow, India",
    degree: "Class 10 — ICSE",
    date: "Apr 2015 – Mar 2019",
    grade: "94.6%",
    logo: "/assets/LMClogo.jpg",
    desc: "",
  },
];

/**
 * Free-form facts that do not belong to a section but that the RAG terminal
 * should still be able to answer from.
 */
export const extraFacts = [
  {
    topic: "Availability",
    text: "Yash is open to full-time Full Stack, Frontend and AI Engineer roles. He is open to relocating anywhere in the world and is equally comfortable working fully remote.",
  },
  {
    topic: "Working style",
    text: "Yash prefers owning features end to end — API design, state management and UI — and has consistently been the person who takes a screen from empty file to shipped.",
  },
  {
    topic: "Interests",
    text: "Outside of code Yash is a hybrid athlete, splitting training between lifting and endurance work. He is an everyday learner and currently going deep on LLM application integration, LangChain and retrieval-augmented generation.",
  },
  {
    topic: "This portfolio",
    text: "This site is built with Vite, React and Tailwind CSS. Its UI is a tribute to Avi Vashishta's Portfolio2021 layout. It ships three things most portfolios do not: a retrieval-augmented terminal that answers questions about Yash from a local knowledge base, an llms.txt endpoint so language-model crawlers can read Yash's profile as structured text, and optional webcam hand-tracking that lets you scroll and click with gestures.",
  },
];

export default {
  identity,
  socials,
  skillGroups,
  skills,
  experience,
  projects,
  education,
  extraFacts,
};
