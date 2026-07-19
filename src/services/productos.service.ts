import {
    findCategorias,
    findProductoById,
    findProductIdsByCategories,
    findProductos,
    type ProductoListItem,
} from "../repositories/productos.repository.js";
import {
    buildPaginatedResponse,
    type PaginatedResponse,
    type PaginationParams,
} from "../utils/pagination.js";
import type { SortParams } from "../utils/parse-query.js";

export type { ProductoListItem };

export async function fetchProductos(
    pagination: PaginationParams,
    sort: SortParams,
    categoriaIds?: number[]
): Promise<PaginatedResponse<ProductoListItem>> {
    if (categoriaIds?.length) {
        const productoIds = await findProductIdsByCategories(categoriaIds);

        if (!productoIds.length) {
            return buildPaginatedResponse([], 0, pagination);
        }

        const { data, count } = await findProductos({
            from: pagination.from,
            to: pagination.to,
            sort,
            productoIds,
        });

        return buildPaginatedResponse(data, count, pagination);
    }

    const { data, count } = await findProductos({
        from: pagination.from,
        to: pagination.to,
        sort,
    });

    return buildPaginatedResponse(data, count, pagination);
}

export async function fetchProductoById(productoId: number) {
    return findProductoById(productoId);
}

export async function fetchCategorias() {
    return findCategorias();
}
