'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ThemeToggleButton } from '../ui/ThemeToggle';
import { LanguageSelectorButton } from '../ui/LanguageSelector';

interface AppHeaderProps {
  title?: string | undefined;
  className?: string;
}

export function AppHeader({ title, className = '' }: AppHeaderProps): JSX.Element {
  const { data: session } = useSession();
  const t = useTranslations('auth');


  return (
    <header className={`bg-card shadow-sm border-b border-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-foreground">
                InkGest
              </h1>
            </div>
            {title && (
              <>
                <div className="mx-3 text-muted-foreground">•</div>
                <h2 className="text-lg font-medium text-foreground">
                  {title}
                </h2>
              </>
            )}
          </div>

          {/* Right side - Controls and User */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggleButton />
            
            {/* Language Selector */}
            <LanguageSelectorButton />

            {/* User Menu */}
            {session && (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-sm">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-foreground">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.user.role}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => signOut({ callbackUrl: '/signin' })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title={t('signOut')}
                >
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}