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
