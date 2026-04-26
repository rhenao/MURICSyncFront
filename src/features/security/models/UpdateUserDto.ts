export default interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    isActive?: boolean;
    numDocument?: string;
    roles?: string[];
}