<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class MotorcycleCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // Sources: https://www.honda.qa/en/motors/motorcycles/africa-twin-standard/
        // https://www.royalenfield.com/qa/en/motorcycles/classic-350/
        // https://www.royalenfield.com/qa/en/motorcycles/hunter-350/
        // https://www.royalenfield.com/qa/en/motorcycles/meteor/
        $catalog = [
            [
                'brand' => ['name' => 'Honda', 'slug' => 'honda'],
                'models' => [
                    [
                        'name' => 'Africa Twin Standard',
                        'category' => 'Adventure',
                        'description' => 'Adventure motorcycle listed on Honda Qatar. Qatar retail price and current dealer stock have not been verified.',
                    ],
                ],
            ],
            [
                'brand' => ['name' => 'Royal Enfield', 'slug' => 'royal-enfield'],
                'models' => [
                    [
                        'name' => 'Classic 350',
                        'category' => 'Roadster',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                    ],
                    [
                        'name' => 'Hunter 350',
                        'category' => 'Roadster',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                    ],
                    [
                        'name' => 'Meteor 350',
                        'category' => 'Cruiser',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                    ],
                ],
            ],
        ];

        foreach ($catalog as $entry) {
            $brand = Brand::firstOrCreate(
                ['slug' => $entry['brand']['slug']],
                [
                    'name' => $entry['brand']['name'],
                    'description' => 'Manufacturer with model listings on its official Qatar website.',
                    'image' => null,
                    'status' => 'active',
                ]
            );

            foreach ($entry['models'] as $model) {
                $brand->motorcycles()->firstOrCreate(
                    ['name' => $model['name']],
                    [
                        'category' => $model['category'],
                        'description' => $model['description'],
                        'price' => null,
                        'image' => null,
                        'status' => 'active',
                    ]
                );
            }
        }
    }
}
