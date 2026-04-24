import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
  imports: [CloudinaryModule],
})
export class CommonModule {}
