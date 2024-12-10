'use client';

import React from 'react';
import Image from 'next/image';

const teamMembers = [
  {
    name: "Tarek Dhokkar",
    role: "Club President",
    image: "/team/president.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=John+Doe&background=ef4444&color=fff",
    specialty: "CEH , Bug Bounty",
    description: "Leading Securinets with strategic vision and commitment to excellence in cybersecurity education and innovation.",
    isPresident: true
  },
  {
    name: "Louay Messaoudi",
    role: "Technical Lead",
    image: "/team/member1.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Alice+Smith&background=ef4444&color=fff",
    specialty: "Web Exploitation",
    description: "Driving technical excellence and innovation in our projects and workshops while mentoring team members in web security."
  },
  {
    name: "Cyrine Hanzouti",
    role: "Human Resources",
    image: "/team/member4.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Bob+Johnson&background=ef4444&color=fff",
    specialty: "Binary Analysis",
    description: "Managing team dynamics and fostering a collaborative environment while ensuring effective communication within the club."
  },
  {
    name: "Hind Ben Taher",
    role: "Vice President",
    image: "/team/member3.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Carol+Williams&background=ef4444&color=fff",
    specialty: "Crypto Challenges",
    description: "Supporting club leadership and operations while coordinating strategic initiatives and partnerships."
  },
  {
    name: "Haythem Aouinet",
    role: "Sponsorship Lead",
    image: "/team/member5.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=David+Brown&background=ef4444&color=fff",
    specialty: "Network Pentesting",
    description: "Building valuable partnerships and securing resources to support our club's mission and activities."
  },
  {
    name: "Asma ELBach",
    role: "Tresorer",
    image: "/team/member2.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Eva+Garcia&background=ef4444&color=fff",
    specialty: "Digital Forensics",
    description: "Managing financial operations and ensuring transparent resource allocation for club activities."
  },
  {
    name: "Dhia Hamed",
    role: "Media Lead",
    image: "/team/member7.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Frank+Wilson&background=ef4444&color=fff",
    specialty: "Android/iOS Security",
    description: "Creating engaging content and managing our digital presence across all platforms."
  },
  {
    name: "Wiem Cherni",
    role: "Event Lead",
    image: "/team/member6.jpg",
    fallbackImage: "https://ui-avatars.com/api/?name=Grace+Lee&background=ef4444&color=fff",
    specialty: "Hardware Hacking",
    description: "Organizing impactful cybersecurity events and workshops that bring value to our community."
  }
];

const TeamMemberCard = ({ member }) => {
  // Validate member prop
  if (!member || typeof member !== 'object') {
    console.error('Invalid member prop:', member);
    return null;
  }

  const {
    name = 'Unknown Member',
    role = 'Team Member',
    image = '/default-avatar.png',
    fallbackImage = '/default-avatar.png',
    description = 'No description available'
  } = member;

  const handleImageError = (e) => {
    e.target.src = fallbackImage;
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-gray-800/80 backdrop-blur-sm ring-1 ring-red-500/20 rounded-xl p-6 hover:bg-gray-800/90 transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden ring-2 ring-red-500/20">
          <Image
            src={image || fallbackImage}
            alt={name}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>{role}</span>
          </div>
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Add display name for better debugging
TeamMemberCard.displayName = 'TeamMemberCard';

const TeamSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-4 relative">
            Our Elite Team
            <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-500 to-red-800"></span>
          </h2>
          <p className="mt-8 text-xl text-gray-400 max-w-3xl mx-auto">
            Meet the brilliant minds behind Securinets, dedicated to advancing cybersecurity through innovation and excellence.
          </p>
        </div>

        {/* President Card */}
        <div className="mb-24">
          <div className="max-w-4xl mx-auto">
            <TeamMemberCard member={teamMembers[0]} />
          </div>
        </div>

        {/* Team Grid */}
        <div className="space-y-12">
          {/* First Row - 4 Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.slice(1, 5).map((member, index) => (
              <TeamMemberCard key={`first-row-${index}`} member={member} />
            ))}
          </div>

          {/* Second Row - 3 Centered Members */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.slice(5, 8).map((member, index) => (
                <TeamMemberCard key={`second-row-${index}`} member={member} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
