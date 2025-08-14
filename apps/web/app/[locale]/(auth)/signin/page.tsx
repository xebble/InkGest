import { SignInWrapper } from '../../../../components/auth/SignInWrapper';

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default function SignInPage({ params: _ }: SignInPageProps): JSX.Element {
  return <SignInWrapper />;
}