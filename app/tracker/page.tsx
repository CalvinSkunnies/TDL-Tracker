import type { Metadata } from "next";
import { TasksApp } from "@/components/tasks/tasks-app";

export const metadata: Metadata = { title: "Tasks · Notepad" };

export default function TrackerPage() {
  return <TasksApp />;
}
