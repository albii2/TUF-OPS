export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my/:path*",
    "/settings/:path*",
    "/organizations/:path*",
    "/opportunities/:path*",
    "/api/organizations/:path*",
    "/api/opportunities/:path*",
    "/api/dashboard/:path*",
    "/api/settings/:path*",
  ],
};
