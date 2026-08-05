"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatBrazilianPhone, formatCep, formatDateTimeBR } from "@/lib/br-formatters";
import { addClientAddressAction, addClientContactAction, addClientNoteAction, getClientRelationshipsAction } from "./cliente-360-actions";
import type { ClientAddress, ClientAddressKind, ClientContact, ClientNote } from "./cliente-360-domain";

const addressLabels: Record<ClientAddressKind, string> = { MAIN: "Principal", BILLING: "Cobrança", SERVICE: "Atendimento", DELIVERY: "Entrega", INSTALLATION: "Instalação", OTHER: "Outro" };
export function Client360Panel({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState<"CONTACTS" | "ADDRESSES" | "NOTES">("CONTACTS");
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("BA");
  const [kind, setKind] = useState<ClientAddressKind>("SERVICE");
  const [note, setNote] = useState("");
  const refresh = () => getClientRelationshipsAction(clientId).then((value) => { setContacts(value.contacts); setAddresses(value.addresses); setNotes(value.notes); });
  useEffect(() => { void getClientRelationshipsAction(clientId).then((value) => { setContacts(value.contacts); setAddresses(value.addresses); setNotes(value.notes); }); }, [clientId]);
  async function saveContact() {
    try { await addClientContactAction({ clientId, name: contactName, phone: contactPhone, primary: contacts.length === 0, active: true }); setContactName(""); setContactPhone(""); setMessage("Contato salvo."); await refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível salvar o contato."); }
  }
  async function saveAddress() {
    try { await addClientAddressAction({ clientId, kind, street, city, state, primary: addresses.length === 0, active: true }); setStreet(""); setCity(""); setMessage("Endereço salvo."); await refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível salvar o endereço."); }
  }
  async function saveNote() {
    try { await addClientNoteAction(clientId, note); setNote(""); setMessage("Observação salva."); await refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível salvar a observação."); }
  }
  return <section className="rounded-xl border bg-card">
    <div className="flex gap-1 overflow-x-auto border-b p-2" role="tablist" aria-label="Relacionamento do cliente">
      {[["CONTACTS", "Contatos"], ["ADDRESSES", "Endereços"], ["NOTES", "Observações"]].map(([value, label]) => <Button key={value} size="sm" variant={tab === value ? "default" : "ghost"} role="tab" aria-selected={tab === value} onClick={() => setTab(value as typeof tab)}>{label}</Button>)}
    </div>
    <div className="space-y-3 p-4">
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      {tab === "CONTACTS" ? <><div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ex.: Responsável pela manutenção" aria-label="Nome do contato" /><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(73) 9 8893-6763" aria-label="Telefone do contato" /><Button size="sm" onClick={() => void saveContact()}>Adicionar Contato</Button></div>{contacts.length ? contacts.map((item) => <div key={item.id} className="flex justify-between border-t pt-2 text-sm"><span><strong>{item.name}</strong>{item.primary ? " · Principal" : ""}</span><span>{formatBrazilianPhone(item.phone)}</span></div>) : <EmptyState size="compact" title="Nenhum contato adicional" description="Cadastre pessoas que participam do relacionamento com este cliente." />}</> : null}
      {tab === "ADDRESSES" ? <><div className="grid gap-2 sm:grid-cols-[10rem_1fr_12rem_5rem_auto]"><Select value={kind} onChange={(e) => setKind(e.target.value as ClientAddressKind)} aria-label="Tipo de endereço">{Object.entries(addressLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ex.: Avenida Principal, 120" aria-label="Logradouro" /><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Porto Seguro" aria-label="Cidade" /><Input value={state} maxLength={2} onChange={(e) => setState(e.target.value)} aria-label="Estado" /><Button size="sm" onClick={() => void saveAddress()}>Adicionar</Button></div>{addresses.length ? addresses.map((item) => <div key={item.id} className="border-t pt-2 text-sm"><strong>{addressLabels[item.kind]}{item.primary ? " · Principal" : ""}</strong><p className="text-muted-foreground">{[item.street, item.number, item.city, item.state, item.zipCode ? formatCep(item.zipCode) : ""].filter(Boolean).join(", ")}</p></div>) : <EmptyState size="compact" title="Nenhum endereço adicional" description="Cadastre locais de atendimento, cobrança, entrega ou instalação." />}</> : null}
      {tab === "NOTES" ? <><div className="flex gap-2"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Registre uma informação importante sobre o relacionamento" aria-label="Nova observação" /><Button size="sm" onClick={() => void saveNote()}>Salvar</Button></div>{notes.length ? notes.map((item) => <div key={item.id} className="border-t pt-2 text-sm"><p>{item.text}</p><p className="text-xs text-muted-foreground">{formatDateTimeBR(item.createdAt)}</p></div>) : <EmptyState size="compact" title="Nenhuma observação" description="Informações internas registradas aparecerão aqui." />}</> : null}
    </div>
  </section>;
}
