export default interface Role {
    id: string; // Id from IdentityRole
    name: string; // Name from IdentityRole
    normalizedName?: string; // NormalizedName from IdentityRole
    description?: string;
    isActive: boolean;
    createdAt: string; // Usar string para fechas ISO
}