-- Wypłaty (ujemne kwoty) i kadrowanie zdjęcia celu.

-- wpłata > 0, wypłata < 0; zero nadal niedozwolone
alter table public.deposits drop constraint if exists deposits_amount_check;
alter table public.deposits add constraint deposits_amount_check check (amount <> 0);

-- punkt kadru zdjęcia jako "x% y%" (CSS object-position), null = środek
alter table public.goals add column if not exists photo_position text
  check (photo_position is null or photo_position ~ '^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$');
