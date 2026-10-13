import { redirect } from "next/navigation";

/** The tracker lives at /tracker; keep the root as a simple entry point. */
export default function Home() {
  redirect("/tracker");
}
