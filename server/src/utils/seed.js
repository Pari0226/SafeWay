import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const crimeData = [
  { city: "Delhi", state: "Delhi", crimeRate: 45.0, womenSafety: 6.3, nightSafety: 4.2, size: "metro", population: 32000000 },
  { city: "Mumbai", state: "Maharashtra", crimeRate: 38.7, womenSafety: 7.1, nightSafety: 5.8, size: "metro", population: 20400000 },
  { city: "Bengaluru", state: "Karnataka", crimeRate: 32.4, womenSafety: 7.8, nightSafety: 6.5, size: "metro", population: 13200000 },
  { city: "Kolkata", state: "West Bengal", crimeRate: 29.8, womenSafety: 7.6, nightSafety: 6.3, size: "metro", population: 15000000 },
  { city: "Chennai", state: "Tamil Nadu", crimeRate: 31.2, womenSafety: 7.9, nightSafety: 6.7, size: "metro", population: 11000000 },
  { city: "Hyderabad", state: "Telangana", crimeRate: 30.5, womenSafety: 7.7, nightSafety: 6.4, size: "metro", population: 10500000 },
  { city: "Pune", state: "Maharashtra", crimeRate: 27.9, womenSafety: 7.4, nightSafety: 6.2, size: "tier2", population: 7400000 },
  { city: "Ahmedabad", state: "Gujarat", crimeRate: 26.5, womenSafety: 7.3, nightSafety: 6.1, size: "tier2", population: 8400000 },
  { city: "Jaipur", state: "Rajasthan", crimeRate: 28.7, womenSafety: 7.0, nightSafety: 5.7, size: "tier2", population: 3900000 },
  { city: "Lucknow", state: "Uttar Pradesh", crimeRate: 33.1, womenSafety: 6.6, nightSafety: 5.2, size: "tier2", population: 3400000 },
  { city: "Kanpur", state: "Uttar Pradesh", crimeRate: 31.5, womenSafety: 6.4, nightSafety: 5.0, size: "tier2", population: 3200000 },
  { city: "Nagpur", state: "Maharashtra", crimeRate: 25.8, womenSafety: 7.2, nightSafety: 6.0, size: "tier2", population: 2700000 },
  { city: "Indore", state: "Madhya Pradesh", crimeRate: 24.1, womenSafety: 7.0, nightSafety: 5.8, size: "tier2", population: 3200000 },
  { city: "Surat", state: "Gujarat", crimeRate: 22.7, womenSafety: 7.6, nightSafety: 6.3, size: "tier2", population: 6100000 },
  { city: "Bhopal", state: "Madhya Pradesh", crimeRate: 27.3, womenSafety: 6.8, nightSafety: 5.6, size: "tier2", population: 2400000 },
  { city: "Patna", state: "Bihar", crimeRate: 34.9, womenSafety: 6.0, nightSafety: 4.8, size: "tier2", population: 2300000 },
  { city: "Chandigarh", state: "Chandigarh", crimeRate: 21.4, womenSafety: 8.0, nightSafety: 6.8, size: "tier2", population: 1200000 },
  { city: "Coimbatore", state: "Tamil Nadu", crimeRate: 20.3, womenSafety: 8.2, nightSafety: 7.0, size: "small", population: 2200000 },
  { city: "Kochi", state: "Kerala", crimeRate: 19.8, womenSafety: 8.4, nightSafety: 7.2, size: "small", population: 2100000 },
  { city: "Thiruvananthapuram", state: "Kerala", crimeRate: 18.6, womenSafety: 8.1, nightSafety: 7.1, size: "small", population: 1700000 }
]

async function seed() {
  console.log('🌱 Starting database seed...')
  
  try {
    await prisma.crimeData.deleteMany({})
    console.log('🗑️  Cleared existing crime data')
    
    const result = await prisma.crimeData.createMany({
      data: crimeData,
    })
    
    console.log(`✅ Seeded ${result.count} cities with crime data`)
    console.log('🎉 Database seeding completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()