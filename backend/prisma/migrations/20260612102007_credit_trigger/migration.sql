-- AlterTable (auto-generated drift fix: normalise the jsonb default)
ALTER TABLE "form_fields" ALTER COLUMN "config" SET DEFAULT '{}'::jsonb;

-- Credit ledger trigger (hand-written; Prisma cannot express triggers).
-- Source of truth for a student's balance is the append-only credit_transactions
-- ledger: each INSERT atomically updates students.credit_balance and snapshots
-- the running total into balance_after. Mirrors backend/schema.sql §15.2.

create or replace function apply_credit_transaction() returns trigger as $$
begin
    update students
       set credit_balance = credit_balance + new.delta,
           updated_at     = now()
     where id = new.student_id;

    select credit_balance into new.balance_after
      from students where id = new.student_id;

    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_credit_apply on credit_transactions;
create trigger trg_credit_apply
    before insert on credit_transactions
    for each row execute function apply_credit_transaction();
