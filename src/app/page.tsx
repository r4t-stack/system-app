import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

// Temporary landing — replaced by the authenticated app shell in a later phase.
export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">DevOps Hub</h1>
      <p className="text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">
          {session?.user?.email}
        </span>{" "}
        ({session?.user?.role})
      </p>
      <div>
        <SignOutButton />
      </div>
    </main>
  );
}
