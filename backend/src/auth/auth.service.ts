import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserRole } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => WorkspacesService))
    private workspacesService: WorkspacesService,
  ) {}

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (!host || !user || !pass) {
      console.error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS in env.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from,
      to: email,
      subject: 'Şifre Sıfırlama Talebi - BlogProduce',
      html: `
        <p>Merhaba,</p>
        <p>BlogProduce hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#3B82F6;color:#ffffff;border-radius:6px;text-decoration:none;">
            Şifremi Sıfırla
          </a>
        </p>
        <p>Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Bu bağlantı 1 saat sonra geçerliliğini yitirecektir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
        <p>BlogProduce Ekibi</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Kullanıcıya yine de genel bir başarı mesajı döneceğiz, güvenlik için hata detayı göstermiyoruz
    }
  }

  private async createRefreshToken(user: User): Promise<RefreshToken> {
    // Delete old refresh tokens for this user
    await this.refreshTokenRepository.delete({
      userId: user.id,
      revoked: false,
    });

    const refreshToken = this.refreshTokenRepository.create({
      token: this.generateRefreshToken(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (refreshToken) {
      refreshToken.revoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
    });

    const savedUser = await this.usersRepository.save(user);

    // Otomatik olarak bir workspace oluştur
    try {
      await this.workspacesService.create(savedUser, {
        name: 'Ana Workspace',
        description: 'Varsayılan çalışma alanı',
      });
    } catch (error) {
      // Workspace oluşturma hatası kritik değil, kayıt işlemi devam edebilir
      console.error('Failed to create default workspace:', error);
    }

    // Generate tokens
    const payload = { sub: savedUser.id, email: savedUser.email };
    const access_token = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = await this.createRefreshToken(savedUser);

    return {
      access_token,
      refresh_token: refreshToken.token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Check if this is an admin login attempt using env credentials
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    // If admin credentials match env, authenticate directly
    if (adminEmail && adminPassword && loginDto.email === adminEmail && loginDto.password === adminPassword) {
      // Find or create admin user
      let adminUser = await this.usersRepository.findOne({
        where: { email: adminEmail },
      });

      if (!adminUser) {
        // Create admin user if doesn't exist
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = this.usersRepository.create({
          email: adminEmail,
          password: hashedPassword,
          name: this.configService.get<string>('ADMIN_NAME') || 'Admin User',
          role: UserRole.ADMIN,
        });
        adminUser = await this.usersRepository.save(adminUser);
      } else {
        // Ensure user has admin role
        if (adminUser.role !== UserRole.ADMIN) {
          adminUser.role = UserRole.ADMIN;
          await this.usersRepository.save(adminUser);
        }
      }

      // Generate tokens for admin
      const payload = { sub: adminUser.id, email: adminUser.email };
      const access_token = this.jwtService.sign(payload, { expiresIn: '24h' });
      const refreshToken = await this.createRefreshToken(adminUser);

      return {
        access_token,
        refresh_token: refreshToken.token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      };
    }

    // Regular user login
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Şifre veya e-posta adresi hatalı');
    }

    // Password validation - ensure password exists
    if (!user.password || user.password.trim() === '') {
      throw new UnauthorizedException('Şifre veya e-posta adresi hatalı');
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Şifre veya e-posta adresi hatalı');
    }

    // Generate tokens
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = await this.createRefreshToken(user);

    return {
      access_token,
      refresh_token: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = tokenRecord.user;

    // Revoke old token (token rotation for security)
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload, { expiresIn: '24h' });
    const newRefreshToken = await this.createRefreshToken(user);

    return {
      access_token,
      refresh_token: newRefreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateProfile(userId: string, updateProfileDto: { name?: string; email?: string; phone?: string; bio?: string; location?: string }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is already taken by another user
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
      user.email = updateProfileDto.email;
    }

    if (updateProfileDto.name !== undefined) {
      user.name = updateProfileDto.name;
    }

    if (updateProfileDto.phone !== undefined) {
      user.phone = updateProfileDto.phone;
    }

    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio;
    }

    if (updateProfileDto.location !== undefined) {
      user.location = updateProfileDto.location;
    }

    const updatedUser = await this.usersRepository.save(user);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('User password not set');
    }

    // Verify current password
    try {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    } catch (error) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await this.usersRepository.save(user);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // Kullanıcı bulunamazsa bile "success" döneriz, güvenlik için detay vermeyiz
    if (!user) {
      return;
    }

    const token = this.generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;

    await this.usersRepository.save(user);

    await this.sendPasswordResetEmail(email, token);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    if (!token) {
      throw new BadRequestException('Geçersiz şifre sıfırlama isteği');
    }

    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.usersRepository.save(user);
  }
}
