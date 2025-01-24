import React from "react";
import MagicButton from "./utils/MagicButton";
import { Link } from "react-router-dom";
import { FiGithub } from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa6";


const ProjectCard = ({ title, image, desc, link, github, skills }) => {
  return (
    <div className="my-3 w-80 md:w-96 mx-auto">
      <div className="flex flex-col gap-2 p-3 h-[600px] bg-gradient-to-br from-[#010320] to-[#111325] rounded-xl border border-gray-600">
        {/* Added margin-bottom to create space around the image */}
        <img
          src={`projects/${image}`}
          alt=""
          className="rounded-lg w-full h-64  object-top mb-5"
        />
        <p className="text-3xl font-bold">{title}</p>
        <p className="text-sm md:text-base">{desc}</p>

        <div className="my-2">
          <p className="text-lg font-semibold my-2">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {skills?.map((skill) => (
              <p
                key={skill}
                className="bg-[#1F2937] px-2 py-2 text-xs md:text-sm rounded-full flex justify-center items-center gap-1"
              >
                <img src={`skills/${skill.img}`} alt="" className="w-6" />
                {/* {skill.title} */}
              </p>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-5">
          <Link to={github} target="a">
            <MagicButton
              title="Github"
              w={40}
              icon={<FiGithub size={20} />}
              position="left"
              otherClasses={"text-sm md:text-base"}
            />
          </Link>
          <Link to={link} target="b">
            <MagicButton
              title="Live Preview"
              w={40}
              icon={<FaLocationArrow />}
              position="right"
              otherClasses={"text-sm md:text-base"}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
