-- Supabase schema initialization for OrderFlow
-- Clean, secure setup for Supabase Auth with Role-Based Access Control (Admin and Salesperson)

-- 1. Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('salesperson', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM (
        'Draft',
        'Pending Approval',
        'Admin Accepted',
        'Quotation Generated',
        'Quotation Sent',
        'Completed',
        'Rejected',
        'Cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Safely add any missing values to the ENUM (idempotent)
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Pending Approval'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Admin Accepted'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Quotation Generated'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Quotation Sent'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Completed'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Rejected'; EXCEPTION WHEN OTHERS THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.quotation_status ADD VALUE IF NOT EXISTS 'Cancelled'; EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. Profiles table (id, full_name, email, role, created_at, updated_at)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role user_role NOT NULL DEFAULT 'salesperson',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Backwards-compatibility alias if name column is referenced
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT GENERATED ALWAYS AS (full_name) STORED;
    END IF;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- 3. Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    mobile_no TEXT,
    email TEXT,
    account_dept_phone TEXT,
    account_dept_email TEXT,
    vat_no TEXT,
    cr_no TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_no TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    arabic_description TEXT,
    category TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    color TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number SERIAL,
    customer_id UUID REFERENCES public.customers(id) NOT NULL,
    salesperson_id UUID REFERENCES public.profiles(id) NOT NULL,
    status quotation_status DEFAULT 'Draft',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_terms TEXT,
    delivery_terms TEXT,
    valid_until TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Quotation Items
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES public.product_variants(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_snapshot DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    line_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Discount Approvals
CREATE TABLE IF NOT EXISTS public.discount_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    decided_at TIMESTAMPTZ
);

-- 9. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_approvals ENABLE ROW LEVEL SECURITY;

-- 10. Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. Trigger to automatically create/sync profile on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  -- Extract role from metadata if specified by admin creation, otherwise default to 'salesperson'
  IF (new.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'admin'::public.user_role;
  ELSE
    assigned_role := 'salesperson'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. RLS Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    -- Prevent non-admins from changing their role
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Customers Policies
DROP POLICY IF EXISTS "All authenticated can view customers" ON public.customers;
CREATE POLICY "All authenticated can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Salespeople and Admins can insert customers" ON public.customers;
CREATE POLICY "Salespeople and Admins can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and owners can update customers" ON public.customers;
CREATE POLICY "Admins and owners can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Products viewable by all authenticated" ON public.products;
CREATE POLICY "Products viewable by all authenticated"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Products manageable by admin only" ON public.products;
CREATE POLICY "Products manageable by admin only"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Product Variants Policies
DROP POLICY IF EXISTS "Variants viewable by all authenticated" ON public.product_variants;
CREATE POLICY "Variants viewable by all authenticated"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Variants manageable by admin only" ON public.product_variants;
CREATE POLICY "Variants manageable by admin only"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Quotations Policies
DROP POLICY IF EXISTS "Users can view own or admin all quotations" ON public.quotations;
CREATE POLICY "Users can view own or admin all quotations"
  ON public.quotations FOR SELECT
  TO authenticated
  USING (salesperson_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert quotations" ON public.quotations;
CREATE POLICY "Users can insert quotations"
  ON public.quotations FOR INSERT
  TO authenticated
  WITH CHECK (salesperson_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own draft or admin all quotations" ON public.quotations;
CREATE POLICY "Users can update own draft or admin all quotations"
  ON public.quotations FOR UPDATE
  TO authenticated
  USING (
    (salesperson_id = auth.uid() AND status = 'Draft')
    OR public.is_admin()
  );

-- Quotation Items Policies
DROP POLICY IF EXISTS "Quotation items viewable by authorized quotation viewers" ON public.quotation_items;
CREATE POLICY "Quotation items viewable by authorized quotation viewers"
  ON public.quotation_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
      AND (q.salesperson_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Quotation items insertable by authorized quotation editors" ON public.quotation_items;
CREATE POLICY "Quotation items insertable by authorized quotation editors"
  ON public.quotation_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
      AND (q.salesperson_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Quotation items updatable by authorized quotation editors" ON public.quotation_items;
CREATE POLICY "Quotation items updatable by authorized quotation editors"
  ON public.quotation_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
      AND ((q.salesperson_id = auth.uid() AND q.status = 'Draft') OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Quotation items deletable by authorized quotation editors" ON public.quotation_items;
CREATE POLICY "Quotation items deletable by authorized quotation editors"
  ON public.quotation_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
      AND ((q.salesperson_id = auth.uid() AND q.status = 'Draft') OR public.is_admin())
    )
  );

-- Discount Approvals Policies
DROP POLICY IF EXISTS "Approvals viewable by salesperson or admin" ON public.discount_approvals;
CREATE POLICY "Approvals viewable by salesperson or admin"
  ON public.discount_approvals FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = discount_approvals.quotation_id
      AND q.salesperson_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Approvals insertable by authenticated" ON public.discount_approvals;
CREATE POLICY "Approvals insertable by authenticated"
  ON public.discount_approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Approvals updatable by admin" ON public.discount_approvals;
CREATE POLICY "Approvals updatable by admin"
  ON public.discount_approvals FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- 14. Enable Supabase Realtime Broadcast on tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_items;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_approvals;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
EXCEPTION WHEN OTHERS THEN null;
END $$;

