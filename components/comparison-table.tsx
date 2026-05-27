import { ShieldAlert } from "lucide-react";
import { comparisonRows } from "@/lib/site";

export function ComparisonTable() {
  return (
    <div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#d8c39b] bg-[#fffaf0] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#17110c] text-[#fff7e6]">
              <tr>
                {["方式", "操作难度", "成本", "风险", "适合人群", "注意事项"].map(
                  (head) => (
                    <th className="px-5 py-4 text-sm font-bold" key={head}>
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  className="border-b border-[#ead9b8] last:border-b-0"
                  key={row.method}
                >
                  <td className="px-5 py-4 text-sm font-black text-[#17110c]">
                    {row.method}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6e6257]">
                    {row.difficulty}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6e6257]">{row.cost}</td>
                  <td className="px-5 py-4 text-sm text-[#6e6257]">{row.risk}</td>
                  <td className="px-5 py-4 text-sm text-[#6e6257]">
                    {row.audience}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6e6257]">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#7b6a59]">
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[#9a6a2f]"
        />
        以上对比仅用于下单前判断，不构成成功承诺。AI 平台规则会变化，请以官方页面和商品说明为准。
      </p>
    </div>
  );
}
