<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Motorcycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DataEntryUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function createBrand(string $name): Brand
    {
        return Brand::create([
            'name' => $name,
            'slug' => str($name)->slug(),
            'description' => $name . ' motorcycles',
            'image' => null,
            'status' => 'active',
        ]);
    }

    public function test_unauthenticated_requests_cannot_manage_team_accounts(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
        $this->postJson('/api/users', [])->assertUnauthorized();
    }

    public function test_admin_lists_only_data_entry_accounts_without_passwords(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'data_entry']);
        User::factory()->create(['role' => 'customer']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $employee->id)
            ->assertJsonMissingPath('data.0.password');
    }

    public function test_admin_creates_data_entry_account_with_hashed_password_and_brand(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $brand = $this->createBrand('Honda');
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'Data Entry Employee',
            'email' => 'employee@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
            'brand_ids' => [$brand->id],
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('role', 'data_entry')
            ->assertJsonMissingPath('password');

        $employee = User::where('email', 'employee@example.com')->firstOrFail();
        $this->assertSame('data_entry', $employee->role);
        $this->assertTrue(Hash::check('secure-password', $employee->password));
        $this->assertDatabaseHas('brand_user', [
            'user_id' => $employee->id,
            'brand_id' => $brand->id,
        ]);
    }

    public function test_admin_rejects_duplicate_team_email_addresses(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $existing = User::factory()->create(['email' => 'employee@example.com']);
        $brand = $this->createBrand('Honda');
        Sanctum::actingAs($admin);

        $this->postJson('/api/users', [
            'name' => 'Duplicate Employee',
            'email' => $existing->email,
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
            'brand_ids' => [$brand->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_non_admin_users_cannot_list_create_edit_or_delete_team_accounts(): void
    {
        $brand = $this->createBrand('Honda');
        $employee = User::factory()->create(['role' => 'data_entry']);
        $dataEntry = User::factory()->create(['role' => 'data_entry']);
        $customer = User::factory()->create(['role' => 'customer']);

        foreach ([$dataEntry, $customer] as $user) {
            Sanctum::actingAs($user);
            $this->getJson('/api/users')->assertForbidden();
            $this->postJson('/api/users', [
                'name' => 'Attempted User',
                'email' => 'attempted@example.com',
                'password' => 'secure-password',
                'password_confirmation' => 'secure-password',
                'brand_ids' => [$brand->id],
            ])->assertForbidden();
            $this->getJson('/api/users/' . $employee->id)->assertForbidden();
            $this->putJson('/api/users/' . $employee->id, [
                'name' => 'Changed',
                'email' => $employee->email,
                'brand_ids' => [$brand->id],
            ])->assertForbidden();
            $this->deleteJson('/api/users/' . $employee->id)->assertForbidden();
        }
    }

    public function test_admin_updates_brand_assignments_and_access_tracks_the_new_assignment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'data_entry']);
        $firstBrand = $this->createBrand('Honda');
        $secondBrand = $this->createBrand('Yamaha');
        $employee->brands()->attach($firstBrand);
        Sanctum::actingAs($admin);

        $this->putJson('/api/users/' . $employee->id, [
            'name' => $employee->name,
            'email' => $employee->email,
            'brand_ids' => [$secondBrand->id],
        ])->assertOk()
            ->assertJsonPath('brands.0.id', $secondBrand->id);

        Sanctum::actingAs($employee);
        $this->getJson('/api/brands')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $secondBrand->id);
        $this->getJson('/api/brands/' . $firstBrand->id)->assertForbidden();
    }

    public function test_admin_can_delete_data_entry_without_deleting_brands_or_motorcycles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'data_entry']);
        $brand = $this->createBrand('Honda');
        $motorcycle = Motorcycle::create([
            'brand_id' => $brand->id,
            'name' => 'Africa Twin Standard',
            'category' => 'Adventure',
            'description' => null,
            'price' => null,
            'image' => null,
            'status' => 'active',
        ]);
        $employee->brands()->attach($brand);
        Sanctum::actingAs($admin);

        $this->deleteJson('/api/users/' . $employee->id)
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);
        $this->assertDatabaseMissing('brand_user', ['user_id' => $employee->id]);
        $this->assertDatabaseHas('brands', ['id' => $brand->id]);
        $this->assertDatabaseHas('motorcycles', ['id' => $motorcycle->id]);
    }

    public function test_admin_cannot_delete_admin_or_customer_accounts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        Sanctum::actingAs($admin);

        $this->deleteJson('/api/users/' . $otherAdmin->id)->assertNotFound();
        $this->deleteJson('/api/users/' . $customer->id)->assertNotFound();
        $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
        $this->assertDatabaseHas('users', ['id' => $customer->id]);
    }
}