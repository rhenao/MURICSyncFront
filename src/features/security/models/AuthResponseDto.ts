import type { UserInfoDto } from "./UserInfoDto";

export default interface AuthResponseDto {
  success: boolean;
  token?: string;
  expiresAt?: string;
  user?: UserInfoDto;
  errors?: string[];
}
