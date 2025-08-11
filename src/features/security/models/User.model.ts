export default interface User {
    userName: string;
    numDocument?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string; // Usar string para fechas en TS, o Date si se parsea
    isActive: boolean;
    createdAt: string; // Usar string para fechas ISO
    updatedAt: string;
}