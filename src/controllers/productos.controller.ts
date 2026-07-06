import type { Request, Response } from "express";
import {
    fetchCategorias,
    fetchProductoById,
    fetchProductos,
} from "../services/productos.service.js";
import { parsePagination } from "../utils/pagination.js";
import { parseCategoryIds, parseSortParams } from "../utils/parse-query.js";

export const getProductos = async (req: Request, res: Response) => {
    const { page, limit, order, dir, categoria_id } = req.query;

    const categoryResult = parseCategoryIds(categoria_id);
    if (categoryResult && "error" in categoryResult) {
        return res.status(400).json({ error: categoryResult.error });
    }

    const pagination = parsePagination(page, limit);
    const sort = parseSortParams(order, dir);

    try {
        const result = await fetchProductos(
            pagination,
            sort,
            categoryResult?.ids
        );
        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: message });
    }
};

export const getProductoById = async (req: Request, res: Response) => {
    const productoId = parseInt(req.params.id as string, 10);

    if (isNaN(productoId)) {
        return res.status(400).json({ error: "ID de producto inválido" });
    }

    try {
        const producto = await fetchProductoById(productoId);

        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json(producto);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: message });
    }
};

export const getCategorias = async (_req: Request, res: Response) => {
    try {
        const categorias = await fetchCategorias();
        res.json(categorias);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: message });
    }
};
