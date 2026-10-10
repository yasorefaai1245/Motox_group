<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Motorcycle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MotorcycleCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeder_is_idempotent_and_publishes_models_without_unverified_prices(): void
    {
        $this->seed(\Database\Seeders\MotorcycleCatalogSeeder::class);
        $this->seed(\Database\Seeders\MotorcycleCatalogSeeder::class);

        $this->assertSame(2, Brand::count());
        $this->assertSame(4, Motorcycle::count());
        $this->assertSame(0, Motorcycle::whereNotNull('price')->count());

        $this->getJson('/api/public/brands')
            ->assertOk()
            ->assertJsonCount(2);
        $this->getJson('/api/public/motorcycles')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.price', null);
    }

    public function test_rerunning_catalog_seeder_does_not_overwrite_existing_catalog_edits(): void
    {
        $this->seed(\Database\Seeders\MotorcycleCatalogSeeder::class);
        $brand = Brand::where('slug', 'royal-enfield')->firstOrFail();
        $model = Motorcycle::where('brand_id', $brand->id)
            ->where('name', 'Classic 350')
            ->firstOrFail();

        $brand->update(['status' => 'inactive']);
        $model->update([
            'description' => 'Admin-reviewed description',
            'price' => 12345,
            'image' => 'verified-model-image.jpg',
            'status' => 'inactive',
        ]);

        $this->seed(\Database\Seeders\MotorcycleCatalogSeeder::class);

        $this->assertDatabaseHas('brands', [
            'id' => $brand->id,
            'status' => 'inactive',
        ]);
        $this->assertDatabaseHas('motorcycles', [
            'id' => $model->id,
            'description' => 'Admin-reviewed description',
            'price' => 12345,
            'image' => 'verified-model-image.jpg',
            'status' => 'inactive',
        ]);
    }
}
