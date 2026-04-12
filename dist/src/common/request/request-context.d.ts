import { Request } from 'express';
declare const requestRoles: readonly ["BUYER", "SELLER", "ADMIN"];
export type RequestRole = (typeof requestRoles)[number];
export interface RequestContext {
    userId: string;
    role: RequestRole;
}
export declare function getRequestContext(req: Request): RequestContext;
export declare function assertRole(context: RequestContext, allowedRoles: RequestRole[]): void;
export {};
