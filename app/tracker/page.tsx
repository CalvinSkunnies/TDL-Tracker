import type { Metadata } from "next";
import { TasksApp } from "@/components/tasks/tasks-app";

export const metadata: Metadata = { title: "Tasks · web-app" };

export default function TrackerPage() {
  return <TasksApp />;
}
