export type ValidatedCreateDto = {
  direccion: string;
  codigo_postal: number | null;
  ciudad: string;
  provincia: string;
  pais: string;
  por_defecto: boolean;
  direccion_extra: string | null;
};

export type ValidatedUpdateDto = {
  direccion?: string;
  codigo_postal?: number | null;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  por_defecto?: boolean;
  direccion_extra?: string | null;
};
