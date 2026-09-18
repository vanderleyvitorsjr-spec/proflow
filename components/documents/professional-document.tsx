"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { documentIdentityFields, visibleDocumentFields, type DocumentField, type ProfessionalDocumentData } from "./professional-document-domain";

function safeAccent(value?: string) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return "#155e75";
  const [red, green, blue] = [1, 3, 5].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return red * 0.299 + green * 0.587 + blue * 0.114 > 190 ? "#155e75" : value;
}

function FieldGrid({ fields, className = "" }: { fields?: DocumentField[]; className?: string }) {
  const visible = visibleDocumentFields(fields ?? []);
  if (!visible.length) return null;
  return <dl className={`grid gap-x-6 gap-y-3 sm:grid-cols-2 ${className}`}>{visible.map((field) => <div key={field.label} className={field.label === "Endereço" || field.label === "Local de atendimento" ? "sm:col-span-2" : ""}><dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{field.label}</dt><dd className="mt-0.5 whitespace-pre-line text-[12px] font-medium leading-5 text-slate-800">{field.value}</dd></div>)}</dl>;
}

export function ProfessionalDocument({ data }: { data: ProfessionalDocumentData }) {
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => setLogoFailed(false), [data.identity?.logoUrl]);
  const accent = safeAccent(data.identity?.primaryColor);
  const style = { "--document-accent": accent, "--document-text": "#0f172a", "--document-muted": "#64748b", "--document-border": "#e2e8f0", "--document-surface": "#f8fafc", "--document-radius": "14px" } as CSSProperties;
  const identityFields = documentIdentityFields(data.identity).filter((field) => field.label !== "Empresa");
  return <div className="document-stage" style={style}>
    <div className="document-toolbar mx-auto mb-3 flex max-w-[210mm] justify-end print:hidden"><Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4"/>Imprimir / Salvar PDF</Button></div>
    <article className="document-print mx-auto min-h-[277mm] max-w-[210mm] overflow-hidden bg-white px-8 py-7 text-[var(--document-text)] shadow-[0_18px_50px_rgba(15,23,42,0.12)] print:min-h-0 print:max-w-none print:overflow-visible print:p-0 print:shadow-none sm:px-11 sm:py-9">
      <header className="document-keep grid grid-cols-[minmax(0,1fr)_auto] gap-8 border-b border-[var(--document-border)] pb-6">
        <div className="min-w-0 pr-2">
          {data.identity?.logoUrl && !logoFailed ? <Image src={data.identity.logoUrl} alt="Logotipo da empresa" width={280} height={110} unoptimized onError={() => setLogoFailed(true)} className="mb-5 h-auto max-h-[100px] w-auto max-w-[260px] origin-left object-contain object-left" /> : <p className="mb-3 text-xl font-extrabold tracking-tight" style={{ color: accent }}>{data.identity?.companyName || data.identity?.legalName || "Empresa prestadora"}</p>}
          {data.identity?.companyName && data.identity.logoUrl && !logoFailed ? <p className="text-sm font-bold text-slate-900">{data.identity.companyName}</p> : null}
          <div className="mt-1 max-w-md space-y-0.5 text-[10px] leading-4 text-slate-600">{identityFields.map((field) => <p key={field.label}><span className="font-semibold text-slate-700">{field.label}:</span> {field.value}</p>)}</div>
        </div>
        <div className="min-w-44 text-right"><p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>{data.nonFiscal ? "Documento não fiscal" : "Proposta comercial"}</p><h1 className="mt-2 text-3xl font-black uppercase leading-none tracking-tight text-slate-950">{data.title}</h1>{data.number ? <p className="mt-2 text-sm font-bold" style={{ color: accent }}>{data.number}</p> : null}<FieldGrid fields={data.headerFields} className="mt-4 !grid-cols-1 gap-y-1 text-right"/></div>
      </header>

      {data.clientFields?.length ? <section className="document-keep mt-6 rounded-[var(--document-radius)] border border-[var(--document-border)] bg-[var(--document-surface)] p-5"><DocumentHeading>Cliente</DocumentHeading><FieldGrid fields={data.clientFields}/></section> : null}
      {data.highlightFields?.length ? <section className="document-keep mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{visibleDocumentFields(data.highlightFields).map((field) => <div key={field.label} className="rounded-xl border border-[var(--document-border)] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{field.label}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-slate-800">{field.value}</p></div>)}</section> : null}
      {data.fields.length ? <section className="document-keep mt-5"><FieldGrid fields={data.fields}/></section> : null}

      <div className="mt-6 space-y-6">{data.sections.filter((section) => section.text?.trim() || section.table).map((section) => <section key={section.title} className="document-section"><DocumentHeading>{section.title}</DocumentHeading>{section.text ? <p className="whitespace-pre-line text-[11px] leading-5 text-slate-700">{section.text}</p> : null}{section.table ? <div className="overflow-hidden rounded-xl border border-[var(--document-border)]"><table className="w-full border-separate border-spacing-0 text-[10px]"><thead><tr>{section.table.columns.map((column, index) => <th key={column} className={`bg-slate-800 px-3 py-2.5 font-semibold text-white ${index > 0 ? "text-right" : "text-left"}`}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map((row, index) => <tr key={index} className={index % 2 ? "bg-slate-50/70" : "bg-white"}>{row.map((cell, cellIndex) => <td key={cellIndex} className={`border-t border-slate-100 px-3 py-3 align-top whitespace-pre-line leading-4 ${cellIndex > 0 ? "text-right tabular-nums" : "text-left"} ${cellIndex === row.length - 1 ? "font-bold text-slate-950" : "text-slate-700"}`}>{cell}</td>)}</tr>)}</tbody></table></div> : null}</section>)}</div>

      {data.financialSummary?.length ? <section className="document-keep ml-auto mt-7 w-full max-w-sm rounded-[var(--document-radius)] border border-[var(--document-border)] bg-[var(--document-surface)] p-5"><DocumentHeading>Resumo financeiro</DocumentHeading><div className="space-y-2">{data.financialSummary.map((item) => <div key={item.label} className={item.featured ? "mt-3 flex items-end justify-between gap-4 border-t-2 pt-3" : "flex justify-between gap-4 text-[11px] text-slate-600"} style={item.featured ? { borderColor: accent } : undefined}><span className={item.featured ? "text-xs font-black uppercase tracking-wide" : ""}>{item.label}</span><strong className={item.featured ? "text-xl font-black" : "font-semibold text-slate-800"} style={item.featured ? { color: accent } : undefined}>{item.value}</strong></div>)}</div></section> : null}
      {data.signatureLabels?.length ? <footer className="document-keep mt-12 grid grid-cols-2 gap-12">{data.signatureLabels.map((label) => <div key={label} className="border-t border-slate-400 pt-2 text-center text-[10px] font-medium text-slate-600">{label}</div>)}</footer> : null}
      {data.identity?.footer ? <p className="document-footer document-keep mt-7 border-t border-[var(--document-border)] pt-3 text-center text-[9px] leading-4 text-slate-500">{data.identity.footer}</p> : null}
    </article>
    <style jsx global>{`@media print { @page { size: A4; margin: 13mm; } html, body { background: white !important; } body > * { visibility: hidden !important; } .document-stage, .document-stage *, .document-print, .document-print * { visibility: visible !important; } .document-stage { position: absolute; inset: 0; width: 100%; } .document-toolbar, aside, nav { display: none !important; } .document-print { width: 100%; } .document-keep, .document-section, tr { break-inside: avoid; page-break-inside: avoid; } thead { display: table-header-group; } tfoot { display: table-footer-group; } }`}</style>
  </div>;
}

function DocumentHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--document-accent)]">{children}</h2>;
}
