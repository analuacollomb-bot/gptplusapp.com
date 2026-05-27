import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

export function ArticleCard({ post }: { post: Post }) {
  return (
    <article className="group gold-card rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-[#c99f55] hover:shadow-lg">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7b6a59]">
        <span className="rounded-md border border-[#d8c39b] bg-[#fff5dc] px-2 py-1 text-[#6b451a]">
          {post.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {formatDate(post.date)}
        </span>
        <span>{post.readingTime}</span>
      </div>
      <h2 className="mt-4 text-lg font-black leading-snug text-[#17110c]">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6e6257]">
        {post.description}
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#7b4f1c]"
        href={`/blog/${post.slug}`}
      >
        查看教程
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </Link>
    </article>
  );
}
