export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/organizations/:path*', '/opportunities/:path*', '/orders/:path*', '/ops-workspace/:path*'],
};
