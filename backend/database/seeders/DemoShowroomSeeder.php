<?php

namespace Database\Seeders;

use App\Models\Motorcycle;
use App\Models\Showroom;
use Illuminate\Database\Seeder;

class DemoShowroomSeeder extends Seeder
{
    public function run(): void
    {
        $demoShowrooms = [
            ['city' => 'Doha, Qatar', 'name' => 'MotoX Doha Demo', 'image' => '/images/showrooms/doha-demo.jpg'],
            ['city' => 'Dubai, UAE', 'name' => 'MotoX Dubai Demo', 'image' => '/images/showrooms/dubai-demo.jpg'],
            ['city' => 'Riyadh, Saudi Arabia', 'name' => 'MotoX Riyadh Demo', 'image' => '/images/showrooms/riyadh-demo.jpg'],
            ['city' => 'Cairo, Egypt', 'name' => 'MotoX Cairo Demo', 'image' => '/images/showrooms/cairo-demo.jpg'],
        ];

        $showrooms = [];

        foreach ($demoShowrooms as $demo) {
            $address = "{$demo['name']} — FICTIONAL DEMO DATA — NOT A REAL LOCATION";

            $showrooms[$demo['name']] = Showroom::updateOrCreate(
                [
                    'city' => $demo['city'],
                    'address' => $address,
                    'type' => 'showroom',
                ],
                [
                    'phone' => null,
                    'opening_hours' => null,
                    'image' => $demo['image'],
                    'status' => 'active',
                ]
            );
        }

        $eligibleBrandIds = Motorcycle::query()
            ->where('status', 'active')
            ->whereHas('brand', fn ($query) => $query->where('status', 'active'))
            ->distinct()
            ->pluck('brand_id')
            ->all();

        $showrooms['MotoX Doha Demo']->brands()->sync($eligibleBrandIds);
    }
}
