export default interface RegisterDto {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    numDocument?: string;
    roles?: string[];
}
