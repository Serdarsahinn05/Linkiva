import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Bütün motoru tek bir merkezden çekiyoruz

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };