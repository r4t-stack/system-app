import Link from "next/link";

const tabs = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/teams", label: "Teams" },
  { href: "/settings/audit", label: "Audit log" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
