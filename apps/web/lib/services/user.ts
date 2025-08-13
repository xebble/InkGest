import { hash, compare } from 'bcryptjs';
import { db } from '../db';
import { User, Role } from '../../types';
import { NotFoundError, ValidationError } from '../../types';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: Role;
  companyId: string;
  storeIds: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  storeIds?: string[];
  preferences?: Record<string, any>;
}

export interface UserWithCompany extends User {
  company: {
    id: string;
    name: string;
  };
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    if (!data.email?.trim()) {
      throw new ValidationError('Email is required');
    }

    if (!data.name?.trim()) {
      throw new ValidationError('Name is required');
    }

    if (!data.password || data.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    if (!data.companyId) {
      throw new ValidationError('Company ID is required');
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    // Verify all store IDs exist and belong to the company
    if (data.storeIds.length > 0) {
      const stores = await db.store.findMany({
        where: {
          id: { in: data.storeIds },
          companyId: data.companyId,
        },
      });

      if (stores.length !== data.storeIds.length) {
        throw new ValidationError('One or more store IDs are invalid');
      }
    }

    try {
      const hashedPassword = await hash(data.password, 12);

      const user = await db.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          name: data.name.trim(),
          password: hashedPassword,
          role: data.role,
          companyId: data.companyId,
          storeIds: JSON.stringify(data.storeIds),
        },
      });

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        storeIds: JSON.parse(user.storeIds),
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserWithCompany> {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      storeIds: JSON.parse(user.storeIds),
    } as UserWithCompany;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserWithCompany | null> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      storeIds: JSON.parse(user.storeIds),
    } as UserWithCompany;
  }

  /**
   * Get users by company ID
   */
  async getUsersByCompanyId(companyId: string): Promise<UserWithCompany[]> {
    const users = await db.user.findMany({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        storeIds: JSON.parse(user.storeIds),
      } as UserWithCompany;
    });
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (emailExists) {
        throw new ValidationError('Email already exists');
      }
    }

    // Verify store IDs if being updated
    if (data.storeIds && data.storeIds.length > 0) {
      const stores = await db.store.findMany({
        where: {
          id: { in: data.storeIds },
          companyId: existingUser.companyId,
        },
      });

      if (stores.length !== data.storeIds.length) {
        throw new ValidationError('One or more store IDs are invalid');
      }
    }

    try {
      const updateData: any = {};
      
      if (data.name) {
        updateData.name = data.name.trim();
      }
      
      if (data.email) {
        updateData.email = data.email.toLowerCase().trim();
      }
      
      if (data.role) {
        updateData.role = data.role;
      }
      
      if (data.storeIds) {
        updateData.storeIds = JSON.stringify(data.storeIds);
      }
      
      if (data.preferences) {
        updateData.preferences = JSON.stringify(data.preferences);
      }

      const user = await db.user.update({
        where: { id },
        data: updateData,
      });

      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        storeIds: JSON.parse(user.storeIds),
        preferences: JSON.parse(user.preferences),
      } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.password) {
      throw new ValidationError('User does not have a password set');
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    try {
      const hashedPassword = await hash(newPassword, 12);
      
      await db.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        artist: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Check if user is an artist with appointments
    if (existingUser.artist) {
      const appointmentCount = await db.appointment.count({
        where: { artistId: existingUser.artist.id },
      });

      if (appointmentCount > 0) {
        throw new ValidationError('Cannot delete user with existing appointments');
      }
    }

    try {
      await db.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      storeIds: JSON.parse(user.storeIds),
      preferences: JSON.parse(user.preferences),
    } as User;
  }
}