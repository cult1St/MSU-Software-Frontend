/**
 * @deprecated Prefer domain services under @src/services.
 * Kept as a thin re-export for any legacy imports.
 */
import authService from "@src/services/auth.service";
import type { LoginDTO } from "@src/dto/auth";

export async function UserSignIn(params: LoginDTO) {
  return authService.login(params);
}
