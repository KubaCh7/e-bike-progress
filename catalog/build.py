#!/usr/bin/env python3
"""Kopiuje katalog e-bike'ów do web i iOS oraz generuje seed SQL dla Supabase.

Uruchom po każdej zmianie catalog/bikes.json:  python3 catalog/build.py
Nowe modele można też dodać bezpośrednio w tabeli bike_catalog w Supabase –
aplikacje pobierają katalog z serwera (bez reinstalacji).
"""
import json
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((root / "catalog/bikes.json").read_text(encoding="utf-8"))
bikes = data["bikes"]

text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
(root / "web/src/data/bikes.json").write_text(text, encoding="utf-8")
ios = root / "ios/Shared/Catalog"
ios.mkdir(parents=True, exist_ok=True)
(ios / "bikes.json").write_text(text, encoding="utf-8")


def q(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def opt(value):
    return q(value) if value else "null"


rows = ",\n".join(
    f"    ({q(b['id'])}, {q(b['brand'])}, {q(b['model'])}, {q(b['category'])}, {b['price']}, "
    f"{q(b['color'])}, {'true' if b.get('featured') else 'false'}, {i}, "
    f"{opt(b.get('image_url'))}, {opt(b.get('image_credit'))}, {opt(b.get('image_source'))})"
    for i, b in enumerate(bikes)
)
sql = f"""-- =====================================================================
-- Katalog e-bike'ów (wygenerowane przez catalog/build.py – nie edytuj ręcznie)
-- =====================================================================

insert into public.bike_catalog (id, brand, model, category, price, color, featured, sort, image_url, image_credit, image_source)
values
{rows}
on conflict (id) do update
    set brand = excluded.brand,
        model = excluded.model,
        category = excluded.category,
        price = excluded.price,
        color = excluded.color,
        featured = excluded.featured,
        sort = excluded.sort,
        image_url = excluded.image_url,
        image_credit = excluded.image_credit,
        image_source = excluded.image_source,
        active = true;
"""
(root / "supabase/migrations/20261031000010_seed_bike_catalog_v2.sql").write_text(sql, encoding="utf-8")
print(f"{len(bikes)} modeli → web, iOS, SQL")
