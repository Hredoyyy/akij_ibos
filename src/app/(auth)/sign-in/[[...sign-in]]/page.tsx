import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary:
            'bg-[#6633FF] hover:bg-[#5528DD] text-white rounded-[12px] font-semibold text-[16px]',
          card: 'rounded-[20px] shadow-lg',
          headerTitle: 'text-[24px] font-semibold text-[#334155]',
          headerSubtitle: 'text-[14px] text-[#64748B]',
          formFieldInput:
            'rounded-[8px] border-[#D1D5DB] focus:border-[#6633FF] focus:ring-[#6633FF]/10',
          footerActionLink: 'text-[#6633FF] hover:text-[#5528DD]',
        },
      }}
      forceRedirectUrl="/dashboard"
    />
  );
}
