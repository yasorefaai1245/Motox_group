<?php

namespace Tests\Feature;
use Illuminate\Testing\Fluent\AssertableJson;
use App\Models\Brand;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use App\Models\Motorcycle;
use App\Models\Showroom;

class ApiAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_catalog_is_accessible_without_login(): void
    {
        $this->getJson('/api/public/brands')
            ->assertOk();
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/brands')
            ->assertUnauthorized();
    }

    public function test_admin_can_access_brands(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/brands')
            ->assertOk();
    }

    public function test_data_entry_cannot_access_admin_only_showrooms(): void
    {
        $user = User::factory()->create([
            'role' => 'data_entry',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/showrooms')
            ->assertForbidden();
    }

    public function test_customer_cannot_access_staff_resource_endpoints(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
        ]);

        Sanctum::actingAs($customer);

        $this->getJson('/api/brands')->assertForbidden();
        $this->getJson('/api/motorcycles')->assertForbidden();
        $this->getJson('/api/services')->assertForbidden();
        $this->getJson('/api/showrooms')->assertForbidden();
        $this->getJson('/api/enquiries')->assertForbidden();
        $this->getJson('/api/test-rides')->assertForbidden();
        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_data_entry_only_sees_assigned_brands(): void
    {
        $user = User::factory()->create([
            'role' => 'data_entry',
        ]);

        $assignedBrand = Brand::create([
            'name' => 'Urban Mobility',
            'slug' => 'urban-mobility',
            'description' => 'Urban motorcycles',
            'image' => null,
            'status' => 'active',
        ]);

        $otherBrand = Brand::create([
            'name' => 'Adventure Motors',
            'slug' => 'adventure-motors',
            'description' => 'Adventure motorcycles',
            'image' => null,
            'status' => 'active',
        ]);

        $user->brands()->attach($assignedBrand->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/brands')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedBrand->id);

        $this->getJson('/api/brands/' . $otherBrand->id)
            ->assertForbidden();
    }


public function test_admin_can_create_a_brand(): void
{
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/brands', [
        'name' => 'Performance Motors',
        'slug' => 'performance-motors',
        'description' => 'Performance motorcycle brand',
        'status' => 'active',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('brands', [
        'slug' => 'performance-motors',
    ]);
}

public function test_data_entry_cannot_create_a_brand(): void
{
    $user = User::factory()->create([
        'role' => 'data_entry',
    ]);

    Sanctum::actingAs($user);

    $this->postJson('/api/brands', [
        'name' => 'Unauthorized Brand',
        'slug' => 'unauthorized-brand',
        'status' => 'active',
    ])->assertForbidden();

    $this->assertDatabaseMissing('brands', [
        'slug' => 'unauthorized-brand',
    ]);
}

public function test_public_visitor_can_submit_an_enquiry(): void
{
    $response = $this->postJson('/api/enquiries', [
        'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com',
        'customer_phone' => '01012345678',
        'type' => 'general',
        'message' => 'I would like more information about your motorcycles.',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('enquiries', [
        'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com',
        'status' => 'pending',
    ]);
}

public function test_public_visitor_can_book_a_test_ride(): void
{
    $brand = Brand::create([
        'name' => 'Urban Mobility',
        'slug' => 'urban-mobility',
        'description' => 'Urban motorcycles',
        'image' => null,
        'status' => 'active',
    ]);

    $motorcycle = Motorcycle::create([
        'brand_id' => $brand->id,
        'name' => 'MotoX Street 500',
        'category' => 'Urban Mobility',
        'description' => 'A test motorcycle',
        'price' => 5000,
        'image' => null,
        'status' => 'active',
    ]);

    $showroom = Showroom::create([
        'city' => 'Doha',
        'address' => 'Test Showroom',
        'phone' => '12345678',
        'type' => 'showroom',
        'opening_hours' => '09:00 - 18:00',
        'image' => null,
        'status' => 'active',
    ]);

    $showroom->brands()->attach($brand->id);

    $response = $this->postJson('/api/test-rides', [
        'motorcycle_id' => $motorcycle->id,
        'showroom_id' => $showroom->id,
        'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com',
        'customer_phone' => '01012345678',
        'ride_date' => now()->addDays(2)->toDateString(),
        'ride_time' => '14:00',
        'notes' => 'Test ride booking',
    ]);

    $response->assertCreated();

    $this->assertDatabaseHas('test_rides', [
        'motorcycle_id' => $motorcycle->id,
        'showroom_id' => $showroom->id,
        'customer_email' => 'customer@example.com',
        'status' => 'pending',
    ]);
}

public function test_data_entry_cannot_update_unassigned_brand(): void
{
    $user = User::factory()->create([
        'role' => 'data_entry',
    ]);

    $brand = Brand::create([
        'name' => 'Adventure Motors',
        'slug' => 'adventure-motors',
        'description' => 'Adventure motorcycles',
        'image' => null,
        'status' => 'active',
    ]);

    Sanctum::actingAs($user);

    $this->putJson('/api/brands/' . $brand->id, [
        'name' => 'Changed Brand',
        'slug' => 'changed-brand',
        'description' => 'Updated description',
        'status' => 'active',
    ])->assertForbidden();

    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
        'name' => 'Adventure Motors',
    ]);
}

}
