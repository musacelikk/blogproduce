import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  // Admin kullanıcı bilgileri - Environment variable'lardan alınır
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  if (!adminEmail || !adminPassword) {
    console.error('❌ HATA: ADMIN_EMAIL ve ADMIN_PASSWORD environment variable\'ları tanımlanmalıdır!');
    console.error('📝 Lütfen .env dosyanıza şunları ekleyin:');
    console.error('   ADMIN_EMAIL=admin@admin.com');
    console.error('   ADMIN_PASSWORD=admin123');
    console.error('   ADMIN_NAME=Admin User (opsiyonel)');
    process.exit(1);
  }

  // Kullanıcı zaten var mı kontrol et
  const existingUser = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingUser) {
    // Eğer kullanıcı varsa, admin rolüne güncelle
    if (existingUser.role !== UserRole.ADMIN) {
      existingUser.role = UserRole.ADMIN;
      await userRepository.save(existingUser);
      console.log(`✅ Kullanıcı admin rolüne güncellendi: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin kullanıcı zaten mevcut: ${adminEmail}`);
    }
  } else {
    // Yeni admin kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: UserRole.ADMIN,
    });

    await userRepository.save(adminUser);
    console.log(`✅ Admin kullanıcı oluşturuldu!`);
    console.log(`📧 E-posta: ${adminEmail}`);
    console.log(`🔑 Şifre: ${adminPassword}`);
    console.log(`👤 İsim: ${adminName}`);
  }

  await app.close();
}

bootstrap()
  .then(() => {
    console.log('✅ İşlem tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Hata:', error);
    process.exit(1);
  });

