import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,/* JwtService pochodzi z JwtModule */
    private readonly i18n: I18nService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const userExists = await this.usersRepository.findOne({
      where: { email: email.trim() },
    });

    if (userExists) {
      throw new BadRequestException(
        this.i18n.t('messages.emailAlreadyRegistered'),
      );
    }

    const user = this.usersRepository.create({
      name: name.trim(),
      email: email.trim(),
      password: bcrypt.hashSync(password, 10),
      isAdmin: false,
    });
    await this.usersRepository.save(user);

    const token = this.jwtService.sign({ userId: user.id });

    return {
      message: this.i18n.t('messages.userRegistered'),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email: email.trim() },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(this.i18n.t('messages.invalidCredentials'));
    }

    const token = this.jwtService.sign({ userId: user.id });

    return {
      message: this.i18n.t('messages.loggedIn'),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('messages.userNotFound'));
    }

    if (updateProfileDto.name !== undefined) {
      user.name = updateProfileDto.name.trim();
    }

    if (updateProfileDto.email !== undefined) {
      user.email = updateProfileDto.email.trim();
    }

    if (updateProfileDto.password) {
      user.password = bcrypt.hashSync(updateProfileDto.password, 10);
    }

    try {
      await this.usersRepository.save(user);
    } catch {
      throw new BadRequestException(this.i18n.t('messages.failedToUpdateUser'));
    }

    return {
      message: this.i18n.t('messages.profileUpdated'),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }

  async findAll() {
    const users = await this.usersRepository.find();

    if (users.length === 0) {
      throw new NotFoundException(this.i18n.t('messages.usersNotFound'));
    }

    return users.map(({ password: _, ...user }) => user);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('messages.noUser'));
    }

    const { password: _, id: __, ...userWithoutPasswordAndId } = user;
    return userWithoutPasswordAndId;
  }

  async updateByAdmin(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('messages.userNotFound'));
    }

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name.trim();
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email.trim();
    }

    if (updateUserDto.isAdmin !== undefined) {
      user.isAdmin = updateUserDto.isAdmin;
    }

    try {
      await this.usersRepository.save(user);
    } catch {
      throw new BadRequestException(this.i18n.t('messages.failedToUpdateUser'));
    }

    return {
      message: this.i18n.t('messages.userDataUpdated'),
    };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('messages.userNotFound'));
    }

    if (user.isAdmin) {
      throw new BadRequestException(
        this.i18n.t('messages.cannotDeleteAdminUser'),
      );
    }

    await this.usersRepository.remove(user);

    return {
      message: this.i18n.t('messages.userDeleted'),
    };
  }
}
