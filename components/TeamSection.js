'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

const TeamSection = () => {
  const teamMembers = [
    {
      name: "John Doe",
      role: "Club President",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=John+Doe&background=ef4444&color=fff",
      specialty: "Security Research",
      isPresident: true,
      socials: {
        github: "https://github.com/johndoe",
        linkedin: "https://linkedin.com/in/johndoe",
        twitter: "https://twitter.com/johndoe"
      }
    },
    {
      name: "Alice Smith",
      role: "Web Security Lead",
      image: "/team/member1.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Alice+Smith&background=ef4444&color=fff",
      specialty: "Web Exploitation",
      socials: {
        github: "https://github.com/alice",
        linkedin: "https://linkedin.com/in/alice"
      }
    },
    {
      name: "Bob Johnson",
      role: "Reverse Engineering",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Bob+Johnson&background=ef4444&color=fff",
      specialty: "Binary Analysis",
      socials: {
        github: "https://github.com/bob",
        twitter: "https://twitter.com/bob"
      }
    },
    {
      name: "Carol Williams",
      role: "Cryptography Expert",
      image: "/team/member3.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Carol+Williams&background=ef4444&color=fff",
      specialty: "Crypto Challenges",
      socials: {
        github: "https://github.com/carol",
        linkedin: "https://linkedin.com/in/carol"
      }
    },
    {
      name: "David Brown",
      role: "Network Security",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=David+Brown&background=ef4444&color=fff",
      specialty: "Network Pentesting",
      socials: {
        github: "https://github.com/david",
        twitter: "https://twitter.com/david"
      }
    },
    {
      name: "Eva Garcia",
      role: "Forensics Specialist",
      image: "/team/member5.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Eva+Garcia&background=ef4444&color=fff",
      specialty: "Digital Forensics",
      socials: {
        github: "https://github.com/eva",
        linkedin: "https://linkedin.com/in/eva"
      }
    },
    {
      name: "Frank Wilson",
      role: "Mobile Security",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Frank+Wilson&background=ef4444&color=fff",
      specialty: "Android/iOS Security",
      socials: {
        github: "https://github.com/frank",
        twitter: "https://twitter.com/frank"
      }
    },
    {
      name: "Grace Lee",
      role: "IoT Security",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Grace+Lee&background=ef4444&color=fff",
      specialty: "Hardware Hacking",
      socials: {
        github: "https://github.com/grace",
        linkedin: "https://linkedin.com/in/grace"
      }
    },
    {
      name: "Henry Chen",
      role: "Cloud Security",
      image: "/team/member2.jpg",
      fallbackImage: "https://ui-avatars.com/api/?name=Henry+Chen&background=ef4444&color=fff",
      specialty: "Cloud Infrastructure",
      socials: {
        github: "https://github.com/henry",
        twitter: "https://twitter.com/henry"
      }
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-4">Our Elite Team</h2>
          <div className="h-1 w-20 bg-red-500 mx-auto"></div>
        </div>

        {/* President Card */}
        <div className="mb-20">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-gray-900 ring-1 ring-red-500/20 rounded-lg p-8">
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-800 rounded-lg blur opacity-25"></div>
                    <Image
                      src={teamMembers[0].image}
                      alt={teamMembers[0].name}
                      width={192}
                      height={192}
                      className="relative rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = teamMembers[0].fallbackImage;
                      }}
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white mb-2">{teamMembers[0].name}</h3>
                    <p className="text-red-500 text-lg mb-4">{teamMembers[0].role}</p>
                    <p className="text-gray-400 mb-6">{teamMembers[0].specialty}</p>
                    <div className="flex justify-center md:justify-start space-x-4">
                      {Object.entries(teamMembers[0].socials).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <i className={`fab fa-${platform} text-xl`}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.slice(1).map((member, index) => (
            <div key={index} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-gray-900 ring-1 ring-red-500/20 rounded-lg p-6 transform transition duration-500 hover:-translate-y-1">
                <div className="relative w-full h-48 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-800 rounded-lg blur opacity-25"></div>
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={192}
                    height={192}
                    className="relative rounded-lg w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = member.fallbackImage;
                    }}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-red-500 mb-3">{member.role}</p>
                <p className="text-gray-400 text-sm mb-4">{member.specialty}</p>
                <div className="flex justify-center space-x-4">
                  {Object.entries(member.socials).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className={`fab fa-${platform} text-xl`}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-red-500/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-red-500/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-red-500/5 rounded-full"></div>
      </div>
    </section>
  );
};

export default TeamSection;
