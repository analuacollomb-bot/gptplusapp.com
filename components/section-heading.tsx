export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-black tracking-tight text-[#17110c] sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-8 text-[#6e6257]">{description}</p>
      ) : null}
    </div>
  );
}
