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
  tagline: "Full Stack AI Engineer",
  // The order the hero cycles through them. Mirrored in `@keyframes roleCycle`
  // in src/styles/portfolio.css, which is what actually animates the heading.
  roles: ["Everyday Learner", "Full Stack Developer", "AI Engineer", "Hybrid Athlete"],
  headline: "CS Grad @ Chitkara · Full Stack + AI",
  blurb: "I build AI products end to end — retrieval pipelines, APIs, and the interfaces on top.",
  about: [
    "I am a full stack engineer who works across the whole line: the data and retrieval layer, the services in the middle, and the interface a person actually touches. Most of what I build now has a language model somewhere inside it, which means the interesting problems are rarely the model — they are ingestion, grounding, latency and state.",
    "As a founding engineer at Munshot I built a financial research product from an empty repository: React and TypeScript on the front, FastAPI and NestJS behind it, RAG over PDFs, filings and spreadsheets on Pinecone, and LangGraph agents streaming their answers back token by token. At Genpact I work the other side of the same coin — keeping production BPM workflows healthy on Azure, where a bug has a queue of real users behind it.",
    "Before that, at Lumio AI, I shipped five production applications for US-based clients and built a validation pipeline that checked thousands of PDFs against ground truth and lifted accuracy by 80%.",
    "I care about work that ships and stays shipped. Outside the editor I train as a hybrid athlete, which is roughly the same discipline applied to a different system.",
  ],
  location: "Lucknow / Chandigarh, India",
  relocation: "Open to relocate worldwide · Remote ready",
  learning: ["Agentic Workflows", "LangGraph", "Retrieval-Augmented Generation", "Cloud Architecture"],
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

/**
 * Grouped skills — rendered as the draggable "Variable Skill Set" list.
 *
 * Every technology in the marquee below belongs to exactly one of these groups,
 * so the two lists are two views of the same stack rather than two lists to keep
 * in sync by hand.
 */
export const skillGroups = [
  ["Front End", "React, Next.js, Angular, Tailwind CSS, Redux, TanStack Query"],
  ["Back End", "Node.js, NestJS, Express, FastAPI, Django, ASP.NET"],
  ["AI / LLM", "LangChain, LangGraph, RAG, Pinecone, OpenAI & Claude APIs"],
  ["Languages", "TypeScript, JavaScript, Python, C#, C++, SQL"],
  ["Data", "PostgreSQL, MongoDB, Redis, Supabase, Prisma"],
  ["Cloud", "AWS — EC2, Cognito, Polly, Organizations · Azure"],
  ["DevOps", "CI/CD with Jenkins, SSH-based deployments, Git"],
  ["Observability", "Grafana, Metabase, Postman"],
];

/**
 * Flat skill list with logo files from `public/skills/`.
 *
 * `color` is each technology's own brand colour, used to tint its tile in the
 * scrolling marquee. Tinted rather than filled: thirty saturated blocks in a row
 * fight each other, and a few of these brands (JavaScript yellow, GitHub black)
 * have no readable white-on-brand version anyway.
 *
 * A couple of entries have no `img` — Amazon Polly and Pinecone publish no mark
 * that is free to redistribute. Those render as a wordmark tile instead of a
 * fabricated logo.
 */
export const skills = [
  { img: "html.png", title: "HTML", color: "#E34F26" },
  { img: "css.png", title: "CSS", color: "#1572B6" },
  { img: "tailwind.svg", title: "Tailwind CSS", color: "#06B6D4" },
  { img: "js.png", title: "JavaScript", color: "#F7DF1E" },
  { img: "Typescript.png", title: "TypeScript", color: "#3178C6" },
  { img: "python.png", title: "Python", color: "#3776AB" },
  { img: "react.png", title: "React", color: "#61DAFB" },
  { img: "nextjs.svg", title: "Next.js", color: "#111111" },
  { img: "angular.svg", title: "Angular", color: "#DD0031" },
  { img: "reactquery.png", title: "React Query", color: "#FF4154" },
  { img: "redux.png", title: "Redux", color: "#764ABC" },
  { img: "zustand.svg", title: "Zustand", color: "#B8763E" },
  { img: "node.png", title: "Node.js", color: "#5FA04E" },
  { img: "nestjs.svg", title: "NestJS", color: "#E0234E" },
  { img: "express.jpg", title: "Express.js", color: "#4B5563" },
  { img: "fastapi.svg", title: "FastAPI", color: "#009688" },
  { img: "django.png", title: "Django", color: "#0C4B33" },
  { img: "langchain.svg", title: "LangChain", color: "#1C3C3C" },
  { img: "openai.svg", title: "OpenAI", color: "#412991" },
  { title: "Pinecone", color: "#1C17FF" },
  { img: "postgresql.svg", title: "PostgreSQL", color: "#4169E1" },
  { img: "mongo.png", title: "MongoDB", color: "#47A248" },
  { img: "redis.svg", title: "Redis", color: "#FF4438" },
  { img: "supabase.svg", title: "Supabase", color: "#3FCF8E" },
  { img: "prisma.svg", title: "Prisma", color: "#2D3748" },
  { img: "aws.svg", title: "AWS", color: "#FF9900" },
  { img: "ec2.svg", title: "Amazon EC2", color: "#FF9900" },
  { img: "cognito.svg", title: "Amazon Cognito", color: "#DD344C" },
  { title: "Amazon Polly", color: "#01A88D" },
  { img: "aws-organizations.svg", title: "AWS Organizations", color: "#E7157B" },
  { img: "azure.svg", title: "Microsoft Azure", color: "#0078D4" },
  { img: "jenkins.svg", title: "Jenkins", color: "#D24939" },
  { img: "grafana.svg", title: "Grafana", color: "#F46800" },
  { img: "metabase.svg", title: "Metabase", color: "#509EE3" },
  { img: "postman.png", title: "Postman", color: "#FF6C37" },
  { img: "git.png", title: "Git", color: "#F05032" },
  { img: "github.png", title: "GitHub", color: "#181717" },
];

/**
 * Roles, most recent first. `type` and `place` are optional — the card only
 * renders the ones a job actually has.
 */
export const experience = [
  {
    id: "munshot",
    company: "Munshot",
    shortName: "Munshot",
    role: "Full Stack Founding Engineer",
    type: "Part-time",
    duration: "Feb 2025 – Aug 2026 · 1 yr 7 mos",
    place: "Singapore · Remote",
    logo: "/assets/munsgot_logo.png",
    link: "https://www.linkedin.com/company/munshot/about/",
    highlights: [
      "Built a React and TypeScript application for financial research, including streaming chat responses, Plotly charts, PDF/document previews, portfolio views, and spreadsheet-based analysis using Redux Toolkit and TanStack Query.",
      "Developed reusable, accessible UI components with Tailwind CSS, Radix UI, and shadcn/ui; delivered responsive layouts, dark mode, file upload, document search, and export flows for PDF, Excel, PowerPoint, and CSV.",
      "Built backend services with Python/FastAPI and TypeScript/NestJS, using REST APIs, JWT authentication, Pydantic and class-validator validation, Prisma, PostgreSQL, Redis, logging, and centralized error handling.",
      "Implemented document ingestion and RAG pipelines for PDF, DOCX, PPTX, XLSX, CSV, and text files using parsing, chunking, embeddings, metadata filtering, and Pinecone vector search to support retrieval over financial documents.",
      "Built AI-agent features with LangGraph, LLM tool calling, streaming SSE/NDJSON responses, market-data and SEC/EDGAR integrations, and Yjs/WebSockets for real-time collaborative spreadsheet editing.",
    ],
  },
  {
    id: "genpact",
    company: "Genpact",
    shortName: "Genpact",
    role: "Software Developer",
    type: "Full-time",
    duration: "Sep 2025 – Present · 1 yr",
    place: "India",
    logo: "/assets/genpact.svg",
    link: "https://www.genpact.com/",
    highlights: [
      "Provided L2 production support for Cora BPM workflow applications, investigating and resolving stuck, failed, and delayed workflow cases.",
      "Closed 120+ Jira tickets with end-to-end ownership, from issue triage and root-cause analysis through resolution, user communication, validation, and closure.",
      "Used C#, ASP.NET/Web APIs, and SQL Server to troubleshoot application behavior, validate data, investigate integration failures, and support workflow recovery.",
      "Monitored Azure-hosted applications through Grafana dashboards, logs, and alerts identified recurring issues, escalated defects with relevant evidence, and helped improve service reliability.",
    ],
  },
  {
    id: "lumio",
    company: "Lumio AI",
    shortName: "Lumio AI",
    role: "Software Engineer",
    type: "Full-time",
    duration: "Sep 2024 – Feb 2025",
    place: "Remote",
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
    text: "Yash is open to full-time Full Stack, AI Engineer and Frontend roles. He is open to relocating anywhere in the world and is equally comfortable working fully remote.",
  },
  {
    topic: "Working style",
    text: "Yash prefers owning features end to end — data model, API design, state management and UI — and has consistently been the person who takes a screen from empty file to shipped. He has worked as a founding engineer on a product with no existing codebase and as L2 support on a production system with real users queued behind every bug, and treats both as the same job seen from different ends.",
  },
  {
    topic: "Interests",
    text: "Outside of code Yash is a hybrid athlete, splitting training between lifting and endurance work. He is an everyday learner and currently going deep on agentic workflows, LangGraph, retrieval-augmented generation and cloud architecture.",
  },
  {
    topic: "This portfolio",
    text: "This site is built with Vite, React and Tailwind CSS. It ships three things most portfolios do not: a retrieval-augmented terminal that answers questions about Yash from a local knowledge base, a plain-text /llms.txt generated from the same data file so language models read curated prose rather than scraped markup, and optional webcam hand-tracking that lets you scroll and click with gestures.",
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
