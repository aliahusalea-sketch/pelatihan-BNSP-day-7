import bcrypt from 'bcryptjs';

import type { UpdateUserData } from './user.model.js';

import type { IUserRepository } from './user.repository.js';

import type {
    User,
    RegisterUserInput
} from './user.model.js';

import { AppError } from '../../shared/errors/app-error.js';

import type {
    PaginationParams,
    PaginationResult
} from '../../shared/pagination/pagination.model.js';

import { createPaginationResult } from '../../shared/pagination/pagination.util.js';

export class GetAllUsersUseCase {

    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        params: PaginationParams
    ): Promise<PaginationResult<User>> {

        const result = await this.userRepository.findAll(params);

        return createPaginationResult(
            result, 
            params
        );
    }
}

export class RegisterUserUseCase {

    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        input: RegisterUserInput
    ): Promise<User> {

        const email = input.email.trim().toLowerCase();

        // Check duplicate email
        const existingUser =
            await this.userRepository.findByEmail(email);

        if (existingUser) {
            throw new AppError(
                'Email sudah terdaftar',
                409
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(
            input.password,
            12
        );

        // Save user
        const user = await this.userRepository.create({
            name: input.name.trim(),
            email,
            passwordHash
        });

        return user;
    }
}
export class GetUserByIdUseCase {

    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        id: string
    ): Promise<User> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new AppError('User tidak ditemukan', 404);
        }

        return user;
    }
}

export class UpdateUserUseCase {

    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        id: string,
        input: UpdateUserData
    ): Promise<User> {
        
        const existingUser = await this.userRepository.findById(id);

        if (!existingUser) {
            throw new AppError('User tidak ditemukan', 404);
        }

        if (input.email) {

            const emailUser = await this.userRepository.findByEmail(input.email);

            if (emailUser && emailUser.id !== id) {
                throw new AppError('Email sudah terdaftar', 409);
            }

        }

        const updatedUser = await this.userRepository.update(id, input);

        if (!updatedUser) {
            throw new AppError('Gagal mengupdate user', 500);
        }

        return updatedUser;
    }
}

export class DeleteUserUseCase {

    constructor(
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        id: string
    ): Promise<void> {
        const deleted = await this.userRepository.delete(id);

        if (!deleted) {
            throw new AppError('User tidak ditemukan', 404);
        }
    }
}