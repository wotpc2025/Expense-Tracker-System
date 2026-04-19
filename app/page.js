/**
 * app/page.js — Landing Page (Public Root Route "/")
 *
 * Server component that acts as the entry point for unauthenticated visitors.
 * Behaviour:
 *   - If the user already has a valid Clerk session (userId is truthy),
 *     they are immediately redirected to /dashboard (no landing page shown).
 *   - Otherwise the public marketing page is rendered: Header + Hero sections.
 *
 * This is a Server Component: auth() is called server-side so no client JS
 * is needed for the auth check.
 */
import Header from "./_components/Header";
import Hero from "./_components/Hero";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header/>
      <Hero/>
    </div>
  );
}
