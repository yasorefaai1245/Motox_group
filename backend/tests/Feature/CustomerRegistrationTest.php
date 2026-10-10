<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_public_registration_creates_a_customer_and_never_accepts_a_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'MotoX Customer',
            'email' => 'customer@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonMissingPath('user.password');

        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertTrue(Hash::check('secure-password', $user->password));
    }

    public function test_public_registration_rejects_duplicate_email_addresses(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Another Customer',
            'email' => 'taken@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_public_registration_requires_matching_password_confirmation(): void
    {
        $this->postJson('/api/register', [
            'name' => 'MotoX Customer',
            'email' => 'customer@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'not-the-same',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_login_accepts_valid_credentials_and_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'staff@example.com',
            'password' => 'secure-password',
            'role' => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email' => 'staff@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();

        $this->postJson('/api/login', [
            'email' => 'staff@example.com',
            'password' => 'secure-password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonMissingPath('user.password');
    }

    public function test_authenticated_session_is_available_until_logout(): void
    {
        User::factory()->create([
            'email' => 'staff@example.com',
            'password' => 'secure-password',
            'role' => 'data_entry',
        ]);

        $this->postJson('/api/login', [
            'email' => 'staff@example.com',
            'password' => 'secure-password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'data_entry');

        $this->getJson('/api/user')->assertOk();
        $this->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');
    }
}
