import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, month, adSpend, customerData } = await req.json()

    // Save customer
    if (customerData) {
      const { error } = await supabase.from('customers').insert({
        business_id: businessId,
        prospect_id: customerData.prospectId,
        name: customerData.name,
        company: customerData.company,
        email: customerData.email,
        contract_value: customerData.contractValue,
        close_date: customerData.closeDate,
        marketing_spend_attributed: adSpend,
      })
      if (error) throw error

      // Mark prospect as customer
      if (customerData.prospectId) {
        await supabase.from('prospects').update({ status: 'customer' }).eq('id', customerData.prospectId)
      }
    }

    // Fetch all customers for this business to calculate ROI
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)

    const totalRevenue = customers?.reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0
    const totalSpend = adSpend || 0
    const customerCount = customers?.length || 0

    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
    const cac = customerCount > 0 ? totalSpend / customerCount : 0
    const avgDealValue = customerCount > 0 ? totalRevenue / customerCount : 0

    const { data: roi_record } = await supabase
      .from('roi_records')
      .upsert({
        business_id: businessId,
        month: month || 3,
        ad_spend: totalSpend,
        revenue_generated: totalRevenue,
        new_customers: customerCount,
        roi_percentage: roi,
        cac,
        ltv: avgDealValue * 3, // Estimated LTV as 3x average deal value
      })
      .select()
      .single()

    return NextResponse.json({
      roi_record,
      summary: {
        totalRevenue,
        totalSpend,
        roi: roi.toFixed(1),
        cac: cac.toFixed(0),
        customerCount,
        avgDealValue: avgDealValue.toFixed(0),
      }
    })
  } catch (err) {
    console.error('ROI error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
