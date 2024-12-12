'use client';
import { Fragment, useState } from 'react';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import HackingText from './HackingText';
import { usePathname } from 'next/navigation';
import { useAuth } from './Providers';
import { useTheme } from './ThemeProvider';
import NavbarCountdown from './NavbarCountdown';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const navigation = [
   
    { name: 'CHALLENGES', href: '/challenges', icon: ShieldCheckIcon },
    { name: 'WRITEUPS', href: '/writeups', icon: DocumentTextIcon },
    { name: 'GROUP BOARD', href: '/group-board', icon: UserGroupIcon },
    { name: 'LEADERBOARD', href: '/leaderboard', icon: TrophyIcon },
    { name: 'FORUM', href: '/forum', icon: ChatBubbleLeftRightIcon },
    { name: 'COUNTDOWN', href: '/countdown', icon: ClockIcon },
    { name: 'STATS', href: '/statistics', icon: ChartBarIcon },
  ];

  return (
    <header className="bg-black border-b border-red-500/20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-5">
            <span className="text-2xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent hover:from-red-400 hover:to-red-700 transition-all duration-300">
              <HackingText text="SECURINETS" />
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-red-500"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <Popover.Group className="hidden lg:flex lg:gap-x-8 items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-1 text-sm font-mono font-semibold text-red-500/70 hover:text-red-500 transition-colors relative"
            >
              <item.icon className="h-4 w-4" />
              <HackingText text={item.name} className="group-hover:text-red-500" />
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}

          {user && (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="group flex items-center gap-1 text-sm font-mono font-semibold text-red-500/70 hover:text-red-500 transition-colors relative outline-none">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>TEAM</span>
                    <ChevronDownIcon className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                      <div className="w-56 shrink rounded-xl bg-gray-900 p-4 text-sm font-mono shadow-lg ring-1 ring-red-500/20">
                        <Link
                          href="/team/dashboard"
                          className="block p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500/70 hover:text-red-500"
                        >
                          &gt; Team_Dashboard
                        </Link>
                        <Link
                          href="/team/create"
                          className="block p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500/70 hover:text-red-500"
                        >
                          &gt; Create_Team
                        </Link>
                        <Link
                          href="/team/join"
                          className="block p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500/70 hover:text-red-500"
                        >
                          &gt; Join_Team
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
              className="group flex items-center gap-1 text-sm font-mono font-semibold text-red-500/70 hover:text-red-500 transition-colors relative"
            >
              <CommandLineIcon className="h-4 w-4" />
              <HackingText text="ADMIN" className="group-hover:text-red-500" />
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          )}
        </Popover.Group>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center space-x-4">
          {user ? (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="group flex items-center gap-2 text-sm font-mono font-semibold text-red-500/70 hover:text-red-500 transition-colors relative outline-none">
                    <UserCircleIcon className="h-6 w-6" />
                    
                    <ChevronDownIcon className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                    <Popover.Panel className="absolute right-0 z-10 mt-5 w-48">
                      <div className="overflow-hidden rounded-xl bg-gray-900 shadow-lg ring-1 ring-red-500/20">
                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="block p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500/70 hover:text-red-500 font-mono text-sm"
                          >
                            &gt; Profile
                          </Link>
                          <button
                            onClick={logout}
                            className="block w-full text-left p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500/70 hover:text-red-500 font-mono text-sm"
                          >
                            &gt; Logout
                          </button>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-mono font-semibold text-red-500/70 hover:text-red-500 transition-colors"
            >
              &gt; LOGIN
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-black px-6 py-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-mono font-bold text-red-500">
                <HackingText text="SECURINETS" />
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-red-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-red-500/20">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group -mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-mono font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <item.icon className="h-4 w-4" />
                    <HackingText text={item.name} className="group-hover:text-red-500" />
                  </Link>
                ))}

                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="group -mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-mono font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <CommandLineIcon className="h-4 w-4" />
                    <HackingText text="ADMIN" className="group-hover:text-red-500" />
                  </Link>
                )}
              </div>
              <div className="py-6">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      href="/profile"
                      className="group -mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-mono font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="group -mx-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-mono font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                    >
                      &gt; LOGOUT
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="group -mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-mono font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    &gt; LOGIN
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
