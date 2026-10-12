import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export default function Home() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-5xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl">
        Your app starts here
      </h1>
      <p className="text-ink-muted mt-5 text-lg leading-relaxed">
        The foundation is in place: Next.js, Tailwind and a small set of
        components. Features come next.
      </p>
      <div className="mt-8">
        <Link href="/design-system" className={buttonStyles({ size: "lg" })}>
          View the design system
        </Link>
      </div>
    </div>
  );
}
