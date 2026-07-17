#!/usr/bin/env python3
"""Convert master_tire_database.xlsx into src/data/generated/* files.

Source (default): ~/Downloads/master_tire_database.xlsx
Override with: MASTER_TIRE_DB=/path/to/file.xlsx python3 scripts/generate-master-tire-data.py
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree.ElementTree import iterparse

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "generated"
SRC = Path(
    os.environ.get(
        "MASTER_TIRE_DB",
        Path.home() / "Downloads" / "master_tire_database.xlsx",
    )
)

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
SHEETS = {
    "master_tire_products": "xl/worksheets/sheet3.xml",
    "master_tire_sizes": "xl/worksheets/sheet4.xml",
    "size_product_index": "xl/worksheets/sheet6.xml",
}


def col_to_idx(col: str) -> int:
    n = 0
    for c in col:
        n = n * 26 + (ord(c) - 64)
    return n - 1


def parse_sheet(zf: zipfile.ZipFile, sheet_path: str) -> list[list[str | None]]:
    rows: list[list[str | None]] = []
    with zf.open(sheet_path) as f:
        row_cells: dict[int, str | None] = {}
        max_col = -1
        for _event, elem in iterparse(f, events=("end",)):
            tag = elem.tag
            if tag == NS + "c":
                ref = elem.attrib.get("r", "")
                m = re.match(r"([A-Z]+)", ref)
                if not m:
                    elem.clear()
                    continue
                ci = col_to_idx(m.group(1))
                max_col = max(max_col, ci)
                t = elem.attrib.get("t")
                v_el = elem.find(NS + "v")
                is_el = elem.find(NS + "is")
                val = None
                if t == "inlineStr" and is_el is not None:
                    texts = [t.text or "" for t in is_el.iter(NS + "t")]
                    val = "".join(texts)
                elif v_el is not None and v_el.text is not None:
                    val = v_el.text
                row_cells[ci] = val
                elem.clear()
            elif tag == NS + "row":
                if max_col >= 0:
                    rows.append([row_cells.get(i) for i in range(max_col + 1)])
                row_cells = {}
                max_col = -1
                elem.clear()
    return rows


def rows_to_dicts(rows: list[list[str | None]]):
    header = [
        str(h).strip() if h is not None else f"col{i}" for i, h in enumerate(rows[0])
    ]
    dicts = []
    for r in rows[1:]:
        dicts.append({h: (r[i] if i < len(r) else None) for i, h in enumerate(header)})
    return header, dicts


def write_csv(path: Path, header: list[str], dicts: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        for d in dicts:
            w.writerow({k: ("" if d.get(k) is None else d.get(k)) for k in header})


def main() -> int:
    if not SRC.exists():
        print(f"ERROR: database not found at {SRC}", file=sys.stderr)
        print(
            "Place master_tire_database.xlsx in Downloads or set MASTER_TIRE_DB.",
            file=sys.stderr,
        )
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Reading {SRC}")

    with zipfile.ZipFile(SRC) as zf:
        print("Parsing master_tire_products...")
        prod_header, products = rows_to_dicts(
            parse_sheet(zf, SHEETS["master_tire_products"])
        )
        write_csv(OUT / "master_tire_products.csv", prod_header, products)
        print(f"  {len(products)} rows")

        print("Parsing master_tire_sizes...")
        size_header, sizes = rows_to_dicts(parse_sheet(zf, SHEETS["master_tire_sizes"]))
        write_csv(OUT / "master_tire_sizes.csv", size_header, sizes)
        print(f"  {len(sizes)} rows")

        print("Parsing size_product_index...")
        idx_header, index = rows_to_dicts(parse_sheet(zf, SHEETS["size_product_index"]))
        write_csv(OUT / "master_size_product_index.csv", idx_header, index)
        print(f"  {len(index)} rows")

    size_map: dict[str, list[dict]] = defaultdict(list)
    for row in index:
        key = (row.get("size_slug") or "").strip().lower()
        if not key:
            ts = (row.get("tire_size") or "").strip()
            key = ts.lower().replace("/", "-")
        size_map[key].append(
            {
                "brand": row.get("brand") or "",
                "model": row.get("model") or "",
                "product_family": row.get("product_family") or "",
                "product_category": row.get("product_category") or "",
                "season": row.get("season") or "",
                "tire_size": row.get("tire_size") or "",
                "size_slug": row.get("size_slug") or key,
                "display_size": row.get("display_size") or "",
                "product_code": row.get("product_code") or "",
                "load_range": row.get("load_range") or "",
                "service_description": row.get("service_description") or "",
                "speed_rating": row.get("speed_rating") or "",
                "overall_diameter_in": row.get("overall_diameter_in"),
                "section_width_in": row.get("section_width_in"),
                "overall_width_in": row.get("overall_width_in"),
                "tread_depth_32nds": row.get("tread_depth_32nds"),
                "weight_lb": row.get("weight_lb"),
                "max_load_lb": row.get("max_load_lb"),
                "max_pressure_psi": row.get("max_pressure_psi"),
                "revs_per_mile": row.get("revs_per_mile"),
                "utqg": row.get("utqg") or "",
                "specs_loaded": row.get("specs_loaded") or "",
                "data_quality_status": row.get("data_quality_status") or "",
                "source_url": row.get("source_url") or "",
            }
        )

    out_json = {k: v for k, v in sorted(size_map.items())}
    path = OUT / "master_size_to_products.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(out_json, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {path} ({len(out_json)} sizes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
