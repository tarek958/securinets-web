'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheckIcon, AcademicCapIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';
import CyberBackground from '@/components/CyberBackground';
import TeamSection from '@/components/TeamSection';
import MinimalistCountdown from '@/components/MinimalistCountdown';
import NavbarCountdown from '@/components/NavbarCountdown';
export default function Home() {
  const features = [
    {
      name: 'Challenges',
      description: 'Test your skills with our diverse range of cybersecurity challenges.',
      icon: ShieldCheckIcon,
      href: '/challenges',
    },
    {
      name: 'Learn',
      description: 'Access educational resources and tutorials to improve your knowledge.',
      icon: AcademicCapIcon,
      href: '/learn',
    },
    {
      name: 'Community',
      description: 'Join our active community of cybersecurity enthusiasts.',
      icon: UserGroupIcon,
      href: '/community',
    },
    {
      name: 'Competitions',
      description: 'Participate in CTF competitions and climb the leaderboard.',
      icon: TrophyIcon,
      href: '/competitions',
    },
  ];

  return (
    <main className="relative min-h-screen">
      <CyberBackground />
      
      {/* Content overlay with glass effect */}
      <div className="relative">
        {/* Hero section */}
        <div className="relative">
          <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
            <div className="px-6 lg:px-0 lg:pt-4">
              <div className="mx-auto max-w-2xl backdrop-blur-sm bg-gray-900/40 p-8 rounded-2xl border border-red-500/10 shadow-xl">
                <div className="max-w-lg">
                  <div>
                    <div className="inline-flex space-x-6">
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold leading-6 text-red-400 ring-1 ring-inset ring-red-500/20">
                        Latest Updates
                      </span>
                    </div>
                  </div>
                  <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Welcome to Securinets
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Join our cybersecurity community and enhance your skills through hands-on challenges,
                    collaborative learning, and expert guidance.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Link
                      href="/challenges"
                      className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      Get started
                    </Link>
                    <Link href="/about" className="text-sm font-semibold leading-6 text-gray-300 hover:text-red-400">
                      Learn more <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
              <div className="backdrop-blur-sm bg-gray-900/40 rounded-2xl border border-red-500/10 shadow-xl overflow-hidden">
                <div className="bg-gray-800 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                  <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                    <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                      <div className="w-screen overflow-hidden rounded-tl-xl bg-gray-800/40">
                        <div className="flex bg-gray-800/40 ring-1 ring-white/5">
                          <div className="-mb-px flex text-sm font-medium leading-6 text-gray-400">
                            <div className="border-b border-r border-b-white/20 border-r-white/10 bg-red-500/10 px-4 py-2 text-red-400">
                              Terminal
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-14 pt-6">
                          {/* Terminal content */}
                          <div className="text-gray-300">
                            <span className="text-red-400">$</span> Starting Securinets CTF Platform...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <NavbarCountdown />
          </div>
        </div>
        <div className="container mx-auto px-4">
        <MinimalistCountdown />
      </div>
        {/* Feature section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-8 sm:mt-16">
          <div className="mx-auto max-w-2xl lg:text-center backdrop-blur-sm bg-gray-900/40 p-8 rounded-2xl border border-red-500/10 shadow-xl">
            <h2 className="text-base font-semibold leading-7 text-red-500">Start Learning</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to master cybersecurity
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Access a comprehensive set of tools and resources designed to help you develop your
              cybersecurity skills and knowledge.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature) => (
                <Link key={feature.name} href={feature.href}>
                  <div className="flex flex-col backdrop-blur-sm bg-gray-900/40 p-6 rounded-xl border border-red-500/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-800/50 hover:border-red-500/20">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                      <feature.icon className="h-5 w-5 flex-none text-red-500" aria-hidden="true" />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                </Link>
              ))}
            </dl>
          </div>
        </div>

        {/* Team Section
        <TeamSection /> */}
      </div>
      
    </main>
  );
}
