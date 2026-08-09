"use client";
import { equipmentTechnicalService } from "./equipamento-tecnico-service";
export const listEquipmentTechnicalHistoryAction = (equipmentId: string) => Promise.resolve(equipmentTechnicalService.list(equipmentId));
export const listAllEquipmentTechnicalHistoryAction = () => Promise.resolve(equipmentTechnicalService.listAll());
export const addEquipmentMeasurementAction = (input: Parameters<typeof equipmentTechnicalService.addMeasurement>[0]) => Promise.resolve(equipmentTechnicalService.addMeasurement(input));
export const addEquipmentTechnicalEventAction = (input: Parameters<typeof equipmentTechnicalService.addEvent>[0]) => Promise.resolve(equipmentTechnicalService.addEvent(input));
export const scheduleEquipmentPreventiveAction = (equipmentId: string, baseDate: string, frequency: Parameters<typeof equipmentTechnicalService.schedulePreventive>[2], interval?: number) => Promise.resolve(equipmentTechnicalService.schedulePreventive(equipmentId, baseDate, frequency, interval));
export const setEquipmentPreventiveActiveAction = (planId: string, active: boolean) => Promise.resolve(equipmentTechnicalService.setPreventiveActive(planId, active));
export const completeEquipmentPreventiveAction = (planId: string, completedAt?: string) => Promise.resolve(equipmentTechnicalService.completePreventive(planId, completedAt));
