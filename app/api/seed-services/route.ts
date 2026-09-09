import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { services as rospaServices } from '@/components/serviceData';
import { mensServices as elanServices } from '@/components/mensServiceData';

export const dynamic = 'force-dynamic';

async function seedServices(servicesArray: any[]) {
  const results = [];
  
  const { data: maxIdData } = await supabase
    .from('services')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
    
  let nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

  for (const category of servicesArray) {
    const categoryName = category.name;
    
    for (const item of category.items) {
      const payload: any = {
        id: nextId++,
        name: item.name,
        category: categoryName,
        price: item.price,
      };

      const res = await supabase.from('services').insert([payload]);
      
      if (res.error) {
        results.push(`Error inserting ${item.name}: ${res.error.message}`);
      } else {
        results.push(`Successfully inserted: ${item.name}`);
      }
    }
  }
  return results;
}

export async function GET() {
  try {
    const rospaResults = await seedServices(rospaServices);
    const elanResults = await seedServices(elanServices);
    
    return NextResponse.json({
      success: true,
      message: 'Seeding complete',
      logs: [...rospaResults, ...elanResults]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
