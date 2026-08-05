"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { documentIdentityFields, visibleDocumentFields, type ProfessionalDocumentData } from "./professional-document-domain";

export function ProfessionalDocument({ data }: { data: ProfessionalDocumentData }) {
  return <article className="document-print mx-auto max-w-[210mm] bg-white p-6 text-slate-950 shadow-sm print:max-w-none print:p-0 print:shadow-none">
    <div className="print:hidden mb-4 flex justify-end"><Button size="sm" onClick={() => window.print()}>Imprimir ou Salvar em PDF</Button></div>
    <header className="document-keep flex justify-between gap-6 border-b-2 pb-4" style={{ borderColor: data.identity?.primaryColor ?? "#2563eb" }}>
      <div>{data.identity?.logoUrl ? <Image src={data.identity.logoUrl} alt="Logotipo da empresa" width={176} height={56} unoptimized className="mb-2 max-h-14 max-w-44 object-contain" /> : null}<div className="space-y-0.5 text-xs">{documentIdentityFields(data.identity).map((field) => <p key={field.label}><strong>{field.label}:</strong> {field.value}</p>)}</div></div>
      <div className="text-right"><h1 className="text-2xl font-bold">{data.title}</h1>{data.number ? <p className="font-medium">Nº {data.number}</p> : null}{data.version ? <p>Versão {data.version}</p> : null}</div>
    </header>
    <dl className="document-keep mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">{visibleDocumentFields(data.fields).map((field) => <div key={field.label}><dt className="text-xs font-semibold text-slate-500">{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
    <div className="mt-5 space-y-5">{data.sections.filter((section) => section.text?.trim() || section.table).map((section) => <section key={section.title} className="document-section"><h2 className="mb-2 border-b pb-1 text-sm font-bold uppercase tracking-wide">{section.title}</h2>{section.text ? <p className="whitespace-pre-line text-sm leading-6">{section.text}</p> : null}{section.table ? <table className="w-full border-collapse text-xs"><thead><tr>{section.table.columns.map((column) => <th key={column} className="border p-2 text-left">{column}</th>)}</tr></thead><tbody>{section.table.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border p-2">{cell}</td>)}</tr>)}</tbody></table> : null}</section>)}</div>
    {data.signatureLabels?.length ? <footer className="document-keep mt-16 grid grid-cols-2 gap-12">{data.signatureLabels.map((label) => <div key={label} className="border-t pt-2 text-center text-xs">{label}</div>)}</footer> : null}
    {data.identity?.footer ? <p className="document-footer mt-8 border-t pt-3 text-center text-[10px] text-slate-500">{data.identity.footer}</p> : null}
    <style jsx global>{`@media print { @page { size: A4; margin: 14mm; } body > * { visibility: hidden; } .document-print, .document-print * { visibility: visible; } .document-print { position: absolute; inset: 0; width: 100%; } .document-keep, .document-section, tr { break-inside: avoid; page-break-inside: avoid; } thead { display: table-header-group; } .document-footer { break-inside: avoid; } }`}</style>
  </article>;
}
