"use client";
import { clientRelationshipService } from "./cliente-360-service";
export const getClientRelationshipsAction = (clientId: string) => Promise.resolve(clientRelationshipService.list(clientId));
export const addClientContactAction = (input: Parameters<typeof clientRelationshipService.addContact>[0], confirm = false) => Promise.resolve(clientRelationshipService.addContact(input, confirm));
export const addClientAddressAction = (input: Parameters<typeof clientRelationshipService.addAddress>[0]) => Promise.resolve(clientRelationshipService.addAddress(input));
export const addClientNoteAction = (clientId: string, text: string, responsible?: string) => Promise.resolve(clientRelationshipService.addNote(clientId, text, responsible));
