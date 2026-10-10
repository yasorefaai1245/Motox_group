<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoreServicesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_services_seeder_is_idempotent_and_preserves_unrelated_services(): void
    {
        $unrelated = Service::create([
            'brand_id' => null,
            'name' => 'Unrelated service',
            'description' => 'Keep this existing service.',
            'image' => null,
            'status' => 'inactive',
        ]);
        Service::create([
            'brand_id' => null,
            'name' => 'Financing & Payment Plans',
            'description' => 'Information about financing and payment options where offered by an authorized participating provider.',
            'image' => null,
            'status' => 'active',
        ]);
        Service::create([
            'brand_id' => null,
            'name' => 'Warranty Support',
            'description' => 'General information and assistance with motorcycle warranty enquiries, subject to the applicable manufacturer\'s warranty terms.',
            'image' => null,
            'status' => 'active',
        ]);

        $this->seed(\Database\Seeders\CoreServicesSeeder::class);
        $this->seed(\Database\Seeders\CoreServicesSeeder::class);

        $this->assertSame(7, Service::count());
        $this->assertDatabaseHas('services', [
            'id' => $unrelated->id,
            'name' => 'Unrelated service',
            'status' => 'inactive',
        ]);
        $this->assertDatabaseHas('services', [
            'brand_id' => null,
            'name' => 'Financing & Payment Plans',
            'status' => 'inactive',
        ]);
        $this->assertDatabaseHas('services', [
            'brand_id' => null,
            'name' => 'Warranty Support',
            'status' => 'inactive',
        ]);

        $coreServices = Service::whereIn('name', [
            'Motorcycle Maintenance & Servicing',
            'Genuine Parts & Accessories',
            'Financing & Warranty Support',
            'After-Sales Support & Customer Care',
        ])->get();

        $this->assertCount(4, $coreServices);
        $this->assertSame(4, $coreServices->where('status', 'active')->count());
        $this->assertSame(4, $coreServices->whereNull('brand_id')->count());
        $this->assertSame(4, $coreServices->whereNull('image')->count());
    }

    public function test_public_services_api_returns_active_group_wide_services(): void
    {
        $this->seed(\Database\Seeders\CoreServicesSeeder::class);

        $this->getJson('/api/public/services')
            ->assertOk()
            ->assertJsonCount(4)
            ->assertJsonPath('0.brand_id', null)
            ->assertJsonPath('0.status', 'active');
    }

    public function test_admin_can_manage_group_wide_services_and_data_entry_cannot(): void
    {
        $this->seed(\Database\Seeders\CoreServicesSeeder::class);
        $service = Service::where('name', 'Financing & Warranty Support')->firstOrFail();
        $admin = User::factory()->create(['role' => 'admin']);
        $dataEntry = User::factory()->create(['role' => 'data_entry']);

        Sanctum::actingAs($admin);
        $this->putJson('/api/services/' . $service->id, [
            'name' => 'Financing & Warranty Support',
            'description' => 'Updated warranty assistance information.',
            'brand_id' => null,
            'status' => 'active',
        ])->assertOk();
        $createdServiceId = $this->postJson('/api/services', [
            'name' => 'Admin Group Service',
            'brand_id' => null,
            'status' => 'active',
        ])->assertCreated()->json('id');
        $this->deleteJson('/api/services/' . $createdServiceId)->assertOk();

        Sanctum::actingAs($dataEntry);
        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonPath('total', 0);
        $this->postJson('/api/services', [
            'name' => 'Unauthorized Group Service',
            'brand_id' => null,
            'status' => 'active',
        ])->assertForbidden();
        $this->putJson('/api/services/' . $service->id, [
            'name' => 'Unauthorized edit',
            'brand_id' => null,
        ])->assertForbidden();
        $this->deleteJson('/api/services/' . $service->id)->assertForbidden();
        $this->assertDatabaseMissing('services', [
            'name' => 'Unauthorized Group Service',
        ]);
    }

    public function test_data_entry_can_manage_only_services_for_assigned_brands(): void
    {
        $assignedBrand = Brand::create([
            'name' => 'Assigned Brand',
            'slug' => 'assigned-brand',
            'description' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $otherBrand = Brand::create([
            'name' => 'Other Brand',
            'slug' => 'other-brand',
            'description' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $assignedService = Service::create([
            'brand_id' => $assignedBrand->id,
            'name' => 'Assigned service',
            'description' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $otherService = Service::create([
            'brand_id' => $otherBrand->id,
            'name' => 'Other service',
            'description' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $user = User::factory()->create(['role' => 'data_entry']);
        $user->brands()->attach($assignedBrand);

        Sanctum::actingAs($user);
        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $assignedService->id);
        $this->putJson('/api/services/' . $assignedService->id, [
            'name' => 'Updated assigned service',
            'brand_id' => $assignedBrand->id,
        ])->assertOk();
        $this->putJson('/api/services/' . $assignedService->id, [
            'name' => 'Move to unassigned brand',
            'brand_id' => $otherBrand->id,
        ])->assertForbidden();
        $this->getJson('/api/services/' . $otherService->id)->assertForbidden();
    }
}
