export type PaymentMethodPublic = {
    id: number;
    metodo_pago_id: number;
    alias: string | null;
    ultimos_4: string | null;
    marca: string | null;
    activo: boolean;
    created_at: string;
};
