import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <Image src="/tuf-logo.png" alt="TUF Ops Logo" width={100} height={40} />
        </Link>
        <div className="space-x-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/organizations">Organizations</Link>
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/ops-workspace">Ops Workspace</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </div>
    </nav>
  );
}
