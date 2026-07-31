import {
    findCategorias,
    findProductoById,
    findProductIdsByCategories,
    findProductos,
    type ProductoListItem,
} from "../repositories/productos.repository.js";
import type { ProductListItemDto, ProductDetailDto } from "../dtos/productos.dto.js";
import {
    buildPaginatedResponse,
    type PaginatedResponse,
    type PaginationParams,
} from "../utils/pagination.js";
import type { SortParams } from "../utils/parse-query.js";

function toProductListItem(row: ProductoListItem): ProductListItemDto {
    const inv = (row.producto_inventario as any)?.[0] ?? row.producto_inventario ?? {};
    const cats = (row.producto_categoria as any[]) ?? [];

    return {
        producto_id: Number(row.producto_id),
        nombre: String(row.nombre ?? ""),
        descripcion: row.descripcion != null ? String(row.descripcion) : null,
        precio: Number(row.precio ?? 0),
        imagen_producto: row.imagen_producto != null ? String(row.imagen_producto) : null,
        created_at: String(row.created_at ?? ""),
        producto_inventario: inv,
        producto_categorias: cats.map((c) => ({
            id: Number(c.categorias?.id ?? c.categoria_id),
            nombre: String(c.categorias?.nombre ?? ""),
        })),
    };
}

function toProductDetail(row: any): ProductDetailDto {
    return {
        ...toProductListItem(row),
        proveedores: row.proveedores
            ? { nombre: String(row.proveedores.nombre ?? "") }
            : null,
        created_at: String(row.created_at ?? ""),
    };
}

export async function fetchProductos(
    pagination: PaginationParams,
    sort: SortParams,
    categoriaIds?: number[]
): Promise<PaginatedResponse<ProductListItemDto>> {
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

        return buildPaginatedResponse(
            data.map(toProductListItem),
            count,
            pagination,
        );
    }

    const { data, count } = await findProductos({
        from: pagination.from,
        to: pagination.to,
        sort,
    });

    return buildPaginatedResponse(
        data.map(toProductListItem),
        count,
        pagination,
    );
}

export async function fetchProductoById(productoId: number): Promise<ProductDetailDto | null> {
    const row = await findProductoById(productoId);
    return row ? toProductDetail(row) : null;
}

export async function fetchCategorias() {
    return findCategorias();
}
