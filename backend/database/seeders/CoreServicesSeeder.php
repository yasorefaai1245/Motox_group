<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class CoreServicesSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Motorcycle Maintenance & Servicing',
                'description' => 'Routine motorcycle maintenance, oil changes, inspections, brake checks, and general servicing. Actual availability depends on the participating service center.',
            ],
            [
                'name' => 'Genuine Parts & Accessories',
                'description' => 'Information and enquiries about genuine motorcycle spare parts, riding equipment, and compatible accessories.',
            ],
            [
                'name' => 'Financing & Warranty Support',
                'description' => 'Information about financing options where offered by a participating provider, and warranty enquiries subject to the applicable manufacturer\'s terms. Availability varies.',
            ],
            [
                'name' => 'After-Sales Support & Customer Care',
                'description' => 'Post-purchase assistance, general support, and customer enquiries.',
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['brand_id' => null, 'name' => $service['name']],
                [
                    'description' => $service['description'],
                    'image' => null,
                    'status' => 'active',
                ]
            );
        }

        Service::query()
            ->whereNull('brand_id')
            ->where('name', 'Financing & Payment Plans')
            ->where(
                'description',
                'Information about financing and payment options where offered by an authorized participating provider.'
            )
            ->update(['status' => 'inactive']);

        Service::query()
            ->whereNull('brand_id')
            ->where('name', 'Warranty Support')
            ->where(
                'description',
                'General information and assistance with motorcycle warranty enquiries, subject to the applicable manufacturer\'s warranty terms.'
            )
            ->update(['status' => 'inactive']);
    }
}
