import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AvatarDto {
  @IsString()
  @IsNotEmpty()
  public_id: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url: string;
}
