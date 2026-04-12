import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

const requestRoles = ['BUYER', 'SELLER', 'ADMIN'] as const;

export type RequestRole = (typeof requestRoles)[number];

export interface RequestContext {
  userId: string;
  role: RequestRole;
}

function readHeader(req: Request, key: string): string | undefined {
  const value = req.headers[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' ? value : undefined;
}

export function getRequestContext(req: Request): RequestContext {
  const userId = readHeader(req, 'x-user-id');
  if (!userId) {
    throw new UnauthorizedException('x-user-id header is required');
  }

  const roleHeader = readHeader(req, 'x-user-role')?.toUpperCase() ?? 'BUYER';
  if (!requestRoles.includes(roleHeader as RequestRole)) {
    throw new BadRequestException(
      'x-user-role must be one of BUYER, SELLER, ADMIN',
    );
  }

  return {
    userId,
    role: roleHeader as RequestRole,
  };
}

export function assertRole(
  context: RequestContext,
  allowedRoles: RequestRole[],
): void {
  if (!allowedRoles.includes(context.role)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}
