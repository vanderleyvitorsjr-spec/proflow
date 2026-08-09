"use client";

import { clientRelationshipService } from "./cliente-360-service";

export const getClientRelationshipsAction = (clientId: string) => clientRelationshipService.list(clientId);
export const addClientContactAction = (input: Parameters<typeof clientRelationshipService.addContact>[0], confirm = false) => clientRelationshipService.addContact(input, confirm);
export const addClientAddressAction = (input: Parameters<typeof clientRelationshipService.addAddress>[0]) => clientRelationshipService.addAddress(input);
export const addClientNoteAction = (clientId: string, text: string, responsible?: string) => clientRelationshipService.addNote(clientId, text, responsible);
