export declare enum RegisterRole {
    BUYER = "BUYER",
    SELLER = "SELLER"
}
export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    role: RegisterRole;
}
