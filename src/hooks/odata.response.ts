export interface OdataResponse<T> {
    odataContext: string;
    value: T[];
}
