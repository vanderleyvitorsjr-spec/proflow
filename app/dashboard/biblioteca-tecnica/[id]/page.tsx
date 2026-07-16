import { TechnicalDocumentDetail } from "../technical-document-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TechnicalDocumentDetail id={id}/>}
