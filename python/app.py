import re
from collections import defaultdict

TABLAS_SQL = "tablas.sql"
DUMP_VIEJO = "punto_venta_rd_full.sql"
SALIDA = "datos_finales.sql"

SKIP_TABLES = {
    "roles", "permisos", "roles_permisos",
    "monedas", "tipos_documento", 
    "tipos_comprobante", "unidades_medida",
    "plataforma_config"
}

def leer_tablas(sql):
    tablas = {}
    with open(sql, "r", encoding="utf-8", errors="ignore") as f:
        contenido = f.read()

    bloques = re.findall(
        r"CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?\s*\((.*?)\)\s*ENGINE",
        contenido,
        re.S | re.I
    )

    for tabla, cuerpo in bloques:
        cols = []
        meta = {}
        
        for linea in cuerpo.splitlines():
            linea = linea.strip().rstrip(',')
            if linea.upper().startswith(("PRIMARY", "FOREIGN", "UNIQUE", "KEY", "INDEX", "CONSTRAINT")):
                continue
            
            m = re.match(r"`?(\w+)`?\s+(.*)", linea)
            if m:
                col_name = m.group(1)
                col_def = m.group(2).upper()
                
                cols.append(col_name)
                meta[col_name] = {
                    'not_null': 'NOT NULL' in col_def,
                    'auto_increment': 'AUTO_INCREMENT' in col_def
                }
        
        tablas[tabla] = {'cols': cols, 'meta': meta}

    return tablas

def leer_datos(sql):
    datos = defaultdict(list)
    with open(sql, "r", encoding="utf-8", errors="ignore") as f:
        contenido = f.read()

    pattern = r"INSERT INTO\s+`?(\w+)`?(?:\s+\(([^)]+)\))?\s+VALUES\s+(.*?);"
    
    for match in re.finditer(pattern, contenido, re.S | re.I):
        tabla = match.group(1)
        
        if tabla in SKIP_TABLES:
            continue
        
        cols_str = match.group(2)
        values_block = match.group(3)
        
        cols = []
        if cols_str:
            cols = [c.strip().strip('`') for c in cols_str.split(',')]
        
        filas = separar_filas(values_block)
        
        for fila in filas:
            valores = extraer_valores(fila)
            
            if cols:
                registro = dict(zip(cols, valores))
            else:
                registro = {f'col_{i}': v for i, v in enumerate(valores)}
            
            datos[tabla].append(registro)

    return datos

def separar_filas(bloque):
    filas = []
    nivel = 0
    actual = ""
    in_string = False

    for c in bloque:
        if c == "'" and (not actual or actual[-1] != '\\'):
            in_string = not in_string
        
        if c == "(" and not in_string:
            nivel += 1
            if nivel == 1:
                actual = ""
                continue
        
        if c == ")" and not in_string:
            nivel -= 1
            if nivel == 0:
                if actual:
                    filas.append(actual)
                actual = ""
                continue
        
        if nivel > 0:
            actual += c

    return filas

def extraer_valores(fila):
    valores = []
    actual = ""
    en_string = False
    escape = False

    for c in fila:
        if escape:
            actual += c
            escape = False
            continue

        if c == "\\" and en_string:
            escape = True
            actual += c
            continue

        if c == "'" and not escape:
            en_string = not en_string
            actual += c
            continue

        if c == "," and not en_string:
            valores.append(actual.strip())
            actual = ""
        else:
            actual += c

    if actual:
        valores.append(actual.strip())
    
    return valores

def generar_sql(tablas, datos):
    lineas = ["SET FOREIGN_KEY_CHECKS=0;\n"]
    
    stats = {'tablas': 0, 'registros': 0, 'nuevos': 0}

    for tabla, registros in sorted(datos.items()):
        if tabla not in tablas:
            continue

        if not registros:
            continue
        
        stats['tablas'] += 1
        
        cols_nuevas = tablas[tabla]['cols']
        meta = tablas[tabla]['meta']
        
        lineas.append(f"\n-- {tabla}: {len(registros)} registros")

        for registro in registros:
            cols_insert = []
            vals_insert = []
            
            for col in cols_nuevas:
                if meta[col]['auto_increment']:
                    continue
                
                if col in registro:
                    valor = registro[col]
                    
                    if valor.upper() == 'NULL' and meta[col]['not_null']:
                        if tabla == "cajas" and col == "numero_caja":
                            valor = registro.get('id', '1')
                            stats['nuevos'] += 1
                        elif tabla == "cajas" and col == "fecha_caja":
                            if 'fecha_apertura' in registro:
                                valor = f"DATE({registro['fecha_apertura']})"
                            else:
                                valor = "CURDATE()"
                            stats['nuevos'] += 1
                        else:
                            valor = "''"
                    
                    cols_insert.append(col)
                    vals_insert.append(valor)
                
                elif meta[col]['not_null']:
                    if tabla == "cajas" and col == "numero_caja":
                        valor = registro.get('id', '1')
                    elif tabla == "cajas" and col == "fecha_caja":
                        if 'fecha_apertura' in registro:
                            valor = f"DATE({registro['fecha_apertura']})"
                        else:
                            valor = "CURDATE()"
                    else:
                        valor = "''"
                    
                    cols_insert.append(col)
                    vals_insert.append(valor)
                    stats['nuevos'] += 1

            if cols_insert:
                sql = f"INSERT INTO {tabla} ({','.join(cols_insert)}) VALUES ({','.join(vals_insert)});"
                lineas.append(sql)
                stats['registros'] += 1

    lineas.append("\nSET FOREIGN_KEY_CHECKS=1;")
    
    with open(SALIDA, "w", encoding="utf-8") as out:
        out.write('\n'.join(lineas))
    
    return stats

if __name__ == "__main__":
    print("Leyendo estructura nueva...")
    tablas = leer_tablas(TABLAS_SQL)
    print(f"OK: {len(tablas)} tablas\n")
    
    print("Leyendo datos viejos...")
    datos = leer_datos(DUMP_VIEJO)
    print(f"OK: {len(datos)} tablas con datos\n")
    
    print("Generando SQL...")
    stats = generar_sql(tablas, datos)
    
    print(f"\nCOMPLETADO:")
    print(f"  Tablas: {stats['tablas']}")
    print(f"  Registros: {stats['registros']}")
    print(f"  Campos nuevos: {stats['nuevos']}")
    print(f"\nArchivo: {SALIDA}")