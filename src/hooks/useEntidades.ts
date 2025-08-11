import { useState, useEffect, useCallback } from "react";
import clienteAPI from "../api/clienteAxios";
import type { OdataResponse } from "./odata.response";

export function useEntidades<T>(url: string) {
    const [entidades, setEntidades] = useState<T[]>();
    const [cargando, setCargando] = useState(true);
    console.log("Cargando entidades..."+url);
    const cargarRegistros = useCallback(() => {
        setCargando(true);
        clienteAPI.get<OdataResponse<T>>(url, { }).then(res => {
            console.log("Entidades cargadas: ", res.data);
            setEntidades(res.data.value);
            setCargando(false);

        });
    }, [url]);

    useEffect(() => {
        cargarRegistros();
    }, [cargarRegistros]);

    return { cargando, entidades, cargarRegistros };
}