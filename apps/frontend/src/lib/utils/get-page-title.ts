export function getPageTitle(pathname: string) {
  if (pathname.startsWith("/organizations")) return "Organizations";
  if (pathname.startsWith("/opportunities")) return "Opportunities";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "TUF Ops";
}
