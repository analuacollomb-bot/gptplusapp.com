import { ButtonLink } from "@/components/button-link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black text-[#17110c]">
          页面没有找到
        </h1>
        <p className="mt-4 text-base leading-8 text-[#6e6257]">
          可能是文章 slug 修改了，或者分类链接不存在。可以先返回教程列表查看最新内容。
        </p>
        <div className="mt-8">
          <ButtonLink href="/blog" icon={BookOpen} variant="primary">
            返回教程列表
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
