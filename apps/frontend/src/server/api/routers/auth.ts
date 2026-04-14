import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getServerAuthSession } from "@/server/auth";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async () => {
    const session = await getServerAuthSession();
    return session;
  }),
});
