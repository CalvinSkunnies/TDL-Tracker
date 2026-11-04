import type { Metadata } from "next";
import { JournalScreen } from "@/components/tasks/journal-screen";

export const metadata: Metadata = { title: "Journal · Notepad" };

export default function JournalPage() {
  return <JournalScreen />;
}
