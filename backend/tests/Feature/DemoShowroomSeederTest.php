<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Motorcycle;
use App\Models\Showroom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoShowroomSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_showroom_seeder_is_idempotent_and_preserves_unrelated_records(): void
    {
        $existing = Showroom::create([
            'city' => 'Existing City',
            'address' => 'Existing real business address',
            'phone' => 'Existing phone',
            'type' => 'service_center',
            'opening_hours' => 'Existing hours',
            'image' => null,
            'status' => 'inactive',
        ]);

        $activeBrand = $this->createBrand('Eligible Demo Brand', 'active');
        $inactiveBrand = $this->createBrand('Inactive Demo Brand', 'inactive');
        $this->createMotorcycle($activeBrand, 'Eligible Demo Motorcycle', 'active');
        $this->createMotorcycle($inactiveBrand, 'Ineligible Demo Motorcycle', 'active');
        $this->createMotorcycle($activeBrand, 'Inactive Demo Motorcycle', 'inactive');

        $this->seed(\Database\Seeders\DemoShowroomSeeder::class);
        $this->seed(\Database\Seeders\DemoShowroomSeeder::class);

        $this->assertSame(5, Showroom::count());
        $this->assertDatabaseHas('showrooms', [
            'id' => $existing->id,
            'city' => 'Existing City',
            'address' => 'Existing real business address',
            'status' => 'inactive',
        ]);

        $demos = Showroom::whereIn('city', [
            'Doha, Qatar',
            'Dubai, UAE',
            'Riyadh, Saudi Arabia',
            'Cairo, Egypt',
        ])->get();
        $this->assertCount(4, $demos);

        foreach ($demos as $showroom) {
            $imagePath = public_path(ltrim($showroom->image, '/'));
            $this->assertSame('showroom', $showroom->type);
            $this->assertSame('active', $showroom->status);
            $this->assertNull($showroom->phone);
            $this->assertNull($showroom->opening_hours);
            $this->assertNotNull($showroom->image);
            $this->assertFileExists($imagePath);
            $this->assertStringContainsString('FICTIONAL DEMO DATA', $showroom->address);
            $this->assertStringContainsString('NOT A REAL LOCATION', $showroom->address);
        }

        $doha = $demos->firstWhere('city', 'Doha, Qatar');
        $this->assertEqualsCanonicalizing(
            [$activeBrand->id],
            $doha->brands()->pluck('brands.id')->all()
        );
        $this->assertSame(
            0,
            $demos->where('city', '!=', 'Doha, Qatar')
                ->sum(fn (Showroom $showroom) => $showroom->brands()->count())
        );
    }

    public function test_public_showroom_api_includes_all_four_fictional_demo_showrooms(): void
    {
        $activeBrand = $this->createBrand('Eligible Demo Brand', 'active');
        $this->createMotorcycle($activeBrand, 'Eligible Demo Motorcycle', 'active');
        $this->seed(\Database\Seeders\DemoShowroomSeeder::class);

        $response = $this->getJson('/api/public/showrooms')
            ->assertOk()
            ->assertJsonCount(4);

        $cities = collect($response->json())
            ->pluck('city')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([
            'Cairo, Egypt',
            'Doha, Qatar',
            'Dubai, UAE',
            'Riyadh, Saudi Arabia',
        ], $cities);
        $this->assertSame(4, collect($response->json())->pluck('image')->filter()->unique()->count());
        $doha = collect($response->json())
            ->firstWhere('city', 'Doha, Qatar');
        $this->assertSame(
            [$activeBrand->id],
            collect($doha['brands'])->pluck('id')->all()
        );
    }

    private function createBrand(string $name, string $status): Brand
    {
        return Brand::create([
            'name' => $name,
            'slug' => str($name)->slug(),
            'description' => null,
            'image' => null,
            'status' => $status,
        ]);
    }

    private function createMotorcycle(Brand $brand, string $name, string $status): Motorcycle
    {
        return Motorcycle::create([
            'brand_id' => $brand->id,
            'name' => $name,
            'category' => 'Road',
            'description' => null,
            'price' => null,
            'image' => null,
            'status' => $status,
        ]);
    }
}
