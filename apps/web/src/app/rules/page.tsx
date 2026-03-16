"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { rulesContent } from "@/i18n/rules";

function renderTable(rows: string[]) {
  const cells = rows.map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
  const hasSep = cells.some((row) => row.every((c) => /^-+$/.test(c)));
  const headerRow = cells[0] ?? [];
  const dataRows = hasSep ? cells.slice(2) : cells;
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-white/20">
            {headerRow.map((c, j) => (
              <th key={j} className="py-2 pr-4 text-white/70 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/5">
              {row.map((c, j) => (
                <td key={j} className="py-2 pr-4 text-white/80">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderRules(content: string) {
  const blocks = content.split(/\n\n+/);
  const result: ReactNode[] = [];
  let key = 0;
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split("\n")[0] ?? "";
    if (firstLine.startsWith("## ")) {
      const rest = trimmed.slice(firstLine.length).trim();
      const lines = rest.split("\n");
      const tableLines: string[] = [];
      const otherLines: string[] = [];
      let inTable = false;
      for (const line of lines) {
        if (line.startsWith("|")) {
          inTable = true;
          tableLines.push(line);
        } else if (inTable && tableLines.length > 0) {
          inTable = false;
          otherLines.push(line);
        } else {
          otherLines.push(line);
        }
      }
      result.push(
        <div key={key++} className="mt-6 first:mt-0">
          <h2 className="text-[18px] font-bold text-white mb-2">
            {firstLine.slice(3)}
          </h2>
          {tableLines.length > 0 && renderTable(tableLines)}
          {otherLines.filter((l) => l.trim()).map((line, j) => (
            <p key={j} className="text-[14px] text-white/70 leading-relaxed mb-2">
              {line.startsWith("- ") ? `• ${line.slice(2)}` : line}
            </p>
          ))}
        </div>
      );
      continue;
    }
    if (firstLine.startsWith("# ")) {
      result.push(
        <h1 key={key++} className="text-[22px] font-bold text-white mb-4">
          {firstLine.slice(2)}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith("|")) {
      result.push(
        <div key={key++} className="my-4">
          {renderTable(trimmed.split("\n").filter(Boolean))}
        </div>
      );
      continue;
    }
    result.push(
      <p key={key++} className="text-[14px] text-white/70 leading-relaxed mb-3">
        {trimmed}
      </p>
    );
  }
  return result;
}

export default function RulesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const content = rulesContent[locale];

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      <div
        className="h-12 w-full flex items-center justify-between px-5 shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60"
          onClick={() => router.back()}
          whileTap={{ scale: 0.88 }}
        >
          <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={2} />
        </motion.button>
        <span className="flex-1 text-center text-[17px] font-semibold text-white">
          {locale === "zh" ? "游戏规则" : "Game Rules"}
        </span>
        <LanguageToggle />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <motion.div
          className="max-w-lg mx-auto py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderRules(content)}
        </motion.div>
      </div>
    </div>
  );
}
