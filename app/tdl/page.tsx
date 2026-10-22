import { redirect } from "next/navigation";

/** The tracker lives at /tdl/tracker; keep /tdl as a simple entry point. */
export default function Home() {
  redirect("/tdl/tracker");
}
