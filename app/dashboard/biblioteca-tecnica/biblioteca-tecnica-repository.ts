import { technicalLibraryStorage } from "./biblioteca-tecnica-storage-adapter";
import type { TechnicalLibraryState } from "./biblioteca-tecnica-types";
export class TechnicalLibraryRepository { list=()=>technicalLibraryStorage.load(); save=(state:TechnicalLibraryState)=>technicalLibraryStorage.save(state); }
