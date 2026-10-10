<?php

use Database\Seeders\CoreServicesSeeder;
use Database\Seeders\DemoShowroomSeeder;
use Database\Seeders\MotorcycleCatalogSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

/**
 * Seeds the public catalog (brands, motorcycles, services, showrooms)
 * once on deployment. User accounts are intentionally NOT seeded here.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach ([MotorcycleCatalogSeeder::class, CoreServicesSeeder::class, DemoShowroomSeeder::class] as $seeder) {
            Artisan::call('db:seed', ['--class' => $seeder, '--force' => true]);
        }
    }

    public function down(): void
    {
        //
    }
};
