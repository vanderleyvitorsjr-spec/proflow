import { generateReportAction } from "@/app/dashboard/relatorios/relatorios-actions";
import type { ReportFilter,ReportPeriodPreset } from "@/app/dashboard/relatorios/relatorios-types";
const filters=(preset:ReportPeriodPreset):ReportFilter=>({preset,startDate:"",endDate:"",comparison:"PREVIOUS_PERIOD",comparisonStartDate:"",comparisonEndDate:"",area:"ALL",clientId:"",salesOwner:"",technician:"",category:"",status:"",origin:"",city:"",state:"",serviceType:"",financialAccount:"",financialNature:"",assetOwnership:"",divergence:"",includeArchived:false});
export async function loadDashboardSnapshot(preset:ReportPeriodPreset){return generateReportAction(filters(preset))}
