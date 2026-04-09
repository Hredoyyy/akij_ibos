'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TopNavProps {
  role: 'employer' | 'candidate';
}

export function TopNav({ role }: TopNavProps) {
  const pathname = usePathname();

  const navItems = role === 'employer'
    ? [
        { label: 'Dashboard', href: '/employer/dashboard' },
        { label: 'Create Test', href: '/employer/exams/create' },
      ]
    : [
        { label: 'Dashboard', href: '/candidate/dashboard' },
      ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--bg-white)',
        borderBottomColor: 'var(--border-disabled)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link
            href={role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard'}
            className="flex items-center gap-2"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-sm"
              style={{ backgroundColor: 'var(--button-primary)' }}
            >
              OA
            </div>
            <span className="text-body-large hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
              Assessment
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white'
                      : 'hover:bg-[var(--bg-surface)]'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: 'var(--button-primary)', color: 'var(--text-white)' }
                      : { color: 'var(--text-subtext)' }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Button */}
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
