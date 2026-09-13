'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/lang-context'
import { useCustomers } from '@/context/customer-context'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function NewCustomerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { lang, isRtl } = useLang()
  const { addCustomer } = useCustomers()
  const ar = lang === 'ar'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    if (!DEMO_MODE) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('customers').insert({
        name: formData.get('name'),
        address: formData.get('address'),
        mobile_no: formData.get('mobile_no'),
        email: formData.get('email'),
        account_dept_phone: formData.get('account_dept_phone'),
        account_dept_email: formData.get('account_dept_email'),
        vat_no: formData.get('vat_no'),
        cr_no: formData.get('cr_no'),
        created_by: user?.id,
      })
    } else {
      // Demo mode: save to global context
      addCustomer({
        id: `CUST-${Math.floor(Math.random() * 10000)}`,
        name: formData.get('name') as string,
        nameAr: formData.get('nameAr') as string || formData.get('name') as string,
        contact_person: formData.get('contact_person') as string || 'Unknown',
        mobile_no: formData.get('mobile_no') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        vat_no: formData.get('vat_no') as string,
        cr_no: formData.get('cr_no') as string,
        orders: 0
      })
    }
    router.push('/customers')
  }

  const field = (
    id: string,
    labelEn: string,
    labelAr: string,
    placeholderEn: string,
    placeholderAr: string,
    type = 'text',
    required = false,
    inputDir = isRtl ? 'rtl' : 'ltr'
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {ar ? labelAr : labelEn}
        {required && <span className="text-red-500 ms-1">*</span>}
      </Label>
      <Input id={id} name={id} type={type} required={required} dir={inputDir} placeholder={ar ? placeholderAr : placeholderEn} />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/customers" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          {ar ? 'العملاء' : 'Customers'}
        </Link>
        <span>/</span>
        <span>{ar ? 'عميل جديد' : 'New Customer'}</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">{ar ? 'إضافة عميل جديد' : 'New Customer'}</h2>
        <p className="text-muted-foreground">{ar ? 'أضف عميلاً جديداً إلى قاعدة بياناتك.' : 'Add a new customer to your database.'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{ar ? 'بيانات العميل' : 'Customer Details'}</CardTitle>
            <CardDescription>
              {ar ? 'أدخل معلومات الاتصال والفوترة الرئيسية.' : 'Enter the primary contact and billing information.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Company name — bilingual side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {ar ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}
                  <span className="text-red-500 ms-1">*</span>
                </Label>
                <Input id="name" name="name" required dir="ltr" placeholder="e.g. Al Muhaidib Kitchens" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">{ar ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</Label>
                <Input id="name_ar" name="name_ar" dir="rtl" placeholder="مثال: مطابخ المحيدب" style={{ fontFamily: 'Tahoma, Arial' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('contact_person', 'Contact Person', 'جهة الاتصال', 'Full Name', 'الاسم الكامل', 'text', true)}
              {field('mobile_no', 'Mobile Number', 'رقم الجوال', '+966 5X XXX XXXX', '+966 5X XXX XXXX', 'tel', true, 'ltr')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('email', 'Email Address', 'البريد الإلكتروني', 'email@company.sa', 'email@company.sa', 'email', false, 'ltr')}
              {field('address', 'Address', 'العنوان', 'City, District, Building', 'المدينة، الحي، المبنى')}
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                {ar ? 'معلومات قسم الحسابات (اختياري)' : 'Accounting Department (Optional)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('account_dept_phone', 'Accounts Phone', 'هاتف الحسابات', '+966 1X XXX XXXX', '+966 1X XXX XXXX', 'tel', false, 'ltr')}
                {field('account_dept_email', 'Accounts Email', 'بريد الحسابات', 'accounts@company.sa', 'accounts@company.sa', 'email', false, 'ltr')}
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                {ar ? 'البيانات التجارية' : 'Commercial Information'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('vat_no', 'VAT Number', 'الرقم الضريبي', '3XXXXXXXXXXXXXXXXX', '3XXXXXXXXXXXXXXXXX', 'text', false, 'ltr')}
                {field('cr_no', 'CR Number', 'السجل التجاري', '10XXXXXXXXX', '10XXXXXXXXX', 'text', false, 'ltr')}
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'إضافة العميل' : 'Add Customer')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/customers')}>
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
