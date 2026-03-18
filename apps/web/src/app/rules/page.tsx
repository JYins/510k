"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { rulesContent } from "@/i18n/rules";

interface RuleSection {
  title: string;
  blocks: string[];
}

function renderTable(rows: string[]) {
  const cells = rows.map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
  const hasSep = cells.some((row) => row.every((c) => /^-+$/.test(c)));
  const headerRow = cells[0] ?? [];
  const dataRows = hasSep ? cells.slice(2) : cells;
  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-white/15">
            {headerRow.map((c, j) => (
              <th key={j} className="px-3 py-3 text-white/75 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/5 last:border-b-0">
              {row.map((c, j) => (
                <td key={j} className="px-3 py-3 text-white/85">
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

function parseRules(content: string) {
  const blocks = content.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
  let title = "";
  let intro = "";
  const sections: RuleSection[] = [];
  let currentSection: RuleSection | null = null;

  for (const block of blocks) {
    const firstLine = block.split("\n")[0] ?? "";
    if (firstLine.startsWith("# ")) {
      title = firstLine.slice(2).trim();
      continue;
    }
    if (firstLine.startsWith("## ")) {
      currentSection = {
        title: firstLine.slice(3).trim(),
        blocks: [],
      };
      const rest = block.slice(firstLine.length).trim();
      if (rest) {
        currentSection.blocks.push(rest);
      }
      sections.push(currentSection);
      continue;
    }
    if (!intro) {
      intro = block;
      continue;
    }
    if (!currentSection) {
      currentSection = { title: "", blocks: [] };
      sections.push(currentSection);
    }
    currentSection.blocks.push(block);
  }

  return { title, intro, sections };
}

function renderBlock(block: string, keyPrefix: string) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.every((line) => line.startsWith("|"))) {
    return <div key={keyPrefix}>{renderTable(lines)}</div>;
  }

  const nodes: ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    nodes.push(
      <ul key={`${keyPrefix}-bullets-${nodes.length}`} className="space-y-2 text-[14px] text-white/72 leading-6">
        {bulletBuffer.map((line, index) => (
          <li key={index} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-ios-blue shrink-0" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      return;
    }

    flushBullets();
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={`${keyPrefix}-h3-${index}`} className="text-[15px] font-semibold text-white/92 mt-1">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    nodes.push(
      <p key={`${keyPrefix}-p-${index}`} className="text-[14px] text-white/72 leading-6">
        {line}
      </p>
    );
  });

  flushBullets();
  return <div key={keyPrefix} className="space-y-3">{nodes}</div>;
}

export default function RulesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const content = rulesContent[locale];
  const { title, intro, sections } = parseRules(content);

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
          className="max-w-lg mx-auto py-4 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-ios">
            <h1 className="text-[24px] font-bold text-white tracking-tight">
              {title}
            </h1>
            {intro && (
              <p className="mt-3 text-[14px] leading-6 text-white/68">
                {intro}
              </p>
            )}
          </div>

          {sections.map((section, index) => (
            <div
              key={`${section.title}-${index}`}
              className="rounded-[26px] border border-white/8 bg-ios-gray-500/28 p-5 backdrop-blur-ios shadow-ios"
            >
              {section.title && (
                <h2 className="text-[18px] font-bold text-white mb-4">
                  {section.title}
                </h2>
              )}
              <div className="space-y-4">
                {section.blocks.map((block, blockIndex) => renderBlock(block, `${index}-${blockIndex}`))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
