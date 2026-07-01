import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Not found</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn’t exist or you don’t have access to it.
        </p>
      </div>
      <Link href="/" className="text-primary hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
