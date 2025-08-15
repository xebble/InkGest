import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

// This page only renders when the user visits the root path
// It redirects to the default locale
export default function RootPage(): never {
  redirect(`/${defaultLocale}`);
}