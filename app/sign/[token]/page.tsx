import { SignDocumentClient } from "@/components/sign-document-client";

type SignPageProps = {
  params: Promise<{ token: string }>;
};

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params;
  return <SignDocumentClient token={token} />;
}

