'use client';
import { Fragment, useState } from 'react';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import HackingText from './HackingText';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './Providers';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navigation = [
    { name: 'HOME', href: '/' },
    { name: 'CHALLENGES', href: '/challenges' },
    { name: 'WRITEUPS', href: '/writeups' },
    { name: 'LEADERBOARD', href: '/leaderboard' },
    { name: 'FORUM', href: '/forum' },
    { name: 'COUNTDOWN', href: '/countdown' },
  ];

  return (
    <header className={`bg-${isDark ? 'black' : 'white'} border-b border-${isDark ? 'red-500/20' : 'gray-200'}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className={`text-2xl font-bold bg-gradient-to-r from-${isDark ? 'red-500' : 'red-800'} to-${isDark ? 'red-800' : 'red-500'} bg-clip-text text-transparent hover:from-${isDark ? 'red-400' : 'red-700'} hover:to-${isDark ? 'red-700' : 'red-400'} transition-all duration-300`}>
              <HackingText text="SECURINETS" />
            </span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <Popover.Group className="hidden lg:flex lg:gap-x-12 items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500 transition-colors relative group`}
            >
              <HackingText text={item.name} className={`group-hover:text-red-500`} />
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full`}></span>
            </Link>
          ))}

          {user && (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className={`text-sm font-semibold leading-6 text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500 transition-colors relative group inline-flex items-center gap-x-1 outline-none`}>
                    <span>TEAM</span>
                    <ChevronDownIcon className={`h-5 w-5 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4">
                      <div className={`w-56 shrink rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 text-sm font-semibold leading-6 shadow-lg ring-1 ring-gray-900/5`}>
                        <Link
                          href="/team/dashboard"
                          className={`block p-2 hover:bg-${isDark ? 'gray-700' : 'gray-50'} rounded-lg transition-colors text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500`}
                        >
                          Team Dashboard
                        </Link>
                        <Link
                          href="/team/create"
                          className={`block p-2 hover:bg-${isDark ? 'gray-700' : 'gray-50'} rounded-lg transition-colors text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500`}
                        >
                          Create Team
                        </Link>
                        <Link
                          href="/team/join"
                          className={`block p-2 hover:bg-${isDark ? 'gray-700' : 'gray-50'} rounded-lg transition-colors text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500`}
                        >
                          Join Team
                        </Link>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          )}

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`text-sm font-semibold leading-6 text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500 transition-colors relative group`}
            >
              <HackingText text="ADMIN" className={`group-hover:text-red-500`} />
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full`}></span>
            </Link>
          )}
        </Popover.Group>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user.username}
              </span>
              <button
                onClick={logout}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`text-sm font-semibold leading-6 text-${isDark ? 'gray-300' : 'gray-600'} hover:text-red-500 transition-colors relative group`}
            >
              <HackingText text="LOG IN" className={`group-hover:text-red-500`} />
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full`}></span>
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className={`ml-4 p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-red-500/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className={`text-2xl font-bold bg-gradient-to-r from-${isDark ? 'red-500' : 'red-800'} to-${isDark ? 'red-800' : 'red-500'} bg-clip-text text-transparent`}>
                <HackingText text="SECURINETS" />
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-red-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HackingText text={item.name} />
                  </Link>
                ))}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HackingText text="ADMIN" />
                  </Link>
                )}
              </div>
              <div className="py-6">
                {user ? (
                  <>
                    <div className="mb-4">
                      <span className={`text-sm font-medium text-gray-300`}>
                        {user.username}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/team/dashboard"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Team Dashboard
                      </Link>
                      <Link
                        href="/team/create"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create Team
                      </Link>
                      <Link
                        href="/team/join"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Join Team
                      </Link>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-800 hover:text-red-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HackingText text="LOG IN" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
