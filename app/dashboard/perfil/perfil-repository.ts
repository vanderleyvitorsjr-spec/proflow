import { profileStorage } from "./perfil-storage-adapter";
import type { ProfileState } from "./perfil-types";
export class ProfileRepository {
  load = () => profileStorage.load();
  save = (state: ProfileState, expected: number) => profileStorage.save(state, expected);
}
