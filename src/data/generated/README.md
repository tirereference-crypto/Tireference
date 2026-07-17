# Generated master tire database

Place (or regenerate) these files here:

- `master_size_to_products.json`
- `master_size_product_index.csv`
- `master_tire_sizes.csv`
- `master_tire_products.csv`
- `size-availability-slim.json` (client-safe brands/models/categories for the calculator)

**Source:** `~/Downloads/master_tire_database.xlsx` (sheets: `master_tire_products`, `master_tire_sizes`, `size_product_index`).

**Regenerate:**

```bash
python3 scripts/generate-master-tire-data.py
```

**Regenerate the calculator slim availability index** (after updating master products):

```bash
node scripts/generate-size-availability-slim.mjs
```

Do not hand-edit these files; they are overwritten by the generator.
