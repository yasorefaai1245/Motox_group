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

        $this->assertSame(6, Brand::count());
        $this->assertSame(10, Motorcycle::count());
        $this->assertSame(0, Motorcycle::whereNotNull('price')->count());

        $this->getJson('/api/public/brands')
            ->assertOk()
            ->assertJsonCount(6)
            ->assertJsonPath(
                '0.image',
                '/images/brands/bmw.svg'
            );
        $this->getJson('/api/public/motorcycles')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.price', null)
            ->assertJsonPath(
                'data.0.image',
                '/images/motorcycles/ktm-390-duke.jpg'
            );

        foreach ([
            'honda',
            'royal-enfield',
            'yamaha',
            'bmw-motorrad',
            'triumph',
            'ktm',
        ] as $slug) {
            $brand = Brand::where('slug', $slug)->firstOrFail();
            $this->assertNotEmpty($brand->image);
            $this->assertFileExists(
                public_path(ltrim($brand->image, '/'))
            );
        }

        foreach (Motorcycle::all() as $motorcycle) {
            $this->assertNotEmpty($motorcycle->image);
            $this->assertFileExists(
                public_path(ltrim($motorcycle->image, '/'))
            );
        }
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
