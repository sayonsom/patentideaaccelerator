export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/ideas/:path*",
    "/sprints/:path*",
    "/frameworks/:path*",
    "/prior-art/:path*",
    "/alignment/:path*",
    "/settings/:path*",
  ],
};
