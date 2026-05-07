import { IsMongoId } from 'class-validator';

export class OrderIdParamDto {
  @IsMongoId()
  id: string;
}
