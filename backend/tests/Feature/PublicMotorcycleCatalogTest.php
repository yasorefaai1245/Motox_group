<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Motorcycle;
use App\Models\Showroom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicMotorcycleCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function createBrand(string $name, string $status = 'active'): Brand
    {
        return Brand::create([
            'name' => $name,
            'slug' => str($name)->slug(),
            'description' => null,
            'image' => null,
            'status' => $status,
        ]);
    }

    private function createMotorcycle(Brand $brand, string $name, string $status = 'active'): Motorcycle
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

    public function test_public_catalog_only_returns_active_models_of_active_brands_and_reports_all_pages(): void
    {
        $activeBrand = $this->createBrand('Honda');
        $inactiveBrand = $this->createBrand('Royal Enfield', 'inactive');
        $eligible = [];
        for ($index = 1; $index <= 13; $index++) {
            $eligible[] = $this->createMotorcycle($activeBrand, 'Model ' . $index);
        }
        $this->createMotorcycle($activeBrand, 'Inactive model', 'inactive');
        $this->createMotorcycle($inactiveBrand, 'Hidden brand model');

        $firstPage = $this->getJson('/api/public/motorcycles')
            ->assertOk()
            ->assertJsonPath('total', 13)
            ->assertJsonPath('last_page', 2)
            ->assertJsonCount(12, 'data');
        $secondPage = $this->getJson('/api/public/motorcycles?page=2')
            ->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonCount(1, 'data');

        $returnedIds = collect($firstPage->json('data'))
            ->merge($secondPage->json('data'))
            ->pluck('id')
            ->sort()
            ->values()
            ->all();
        $this->assertSame(
            collect($eligible)->pluck('id')->sort()->values()->all(),
            $returnedIds
        );
    }

    public function test_public_showrooms_include_only_active_brand_associations(): void
    {
        $activeBrand = $this->createBrand('Honda');
        $inactiveBrand = $this->createBrand('Royal Enfield', 'inactive');
        $showroom = Showroom::create([
            'city' => 'Doha',
            'address' => 'Verified business address',
            'phone' => null,
            'type' => 'showroom',
            'opening_hours' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $showroom->brands()->sync([$activeBrand->id, $inactiveBrand->id]);

        $this->getJson('/api/public/showrooms')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.brands.0.id', $activeBrand->id)
            ->assertJsonMissing(['id' => $inactiveBrand->id]);
    }

    public function test_test_ride_endpoint_rejects_a_motorcycle_whose_brand_is_inactive(): void
    {
        $inactiveBrand = $this->createBrand('Royal Enfield', 'inactive');
        $motorcycle = $this->createMotorcycle($inactiveBrand, 'Inactive-brand model');
        $showroom = Showroom::create([
            'city' => 'Doha',
            'address' => 'Verified business address',
            'phone' => null,
            'type' => 'showroom',
            'opening_hours' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $showroom->brands()->attach($inactiveBrand);

        $this->postJson('/api/test-rides', [
            'motorcycle_id' => $motorcycle->id,
            'showroom_id' => $showroom->id,
            'customer_name' => 'MotoX Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '12345678',
            'ride_date' => now()->addDays(2)->toDateString(),
            'ride_time' => '14:00',
        ])->assertUnprocessable();
    }

    public function test_admin_total_and_public_catalog_count_have_distinct_visibility_scopes(): void
    {
        $activeBrand = $this->createBrand('Honda');
        $inactiveBrand = $this->createBrand('Royal Enfield', 'inactive');
        $this->createMotorcycle($activeBrand, 'Public model');
        $this->createMotorcycle($inactiveBrand, 'Hidden model');
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/motorcycles')
            ->assertOk()
            ->assertJsonPath('total', 2);
        $this->getJson('/api/public/motorcycles')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.name', 'Public model');
    }
}
