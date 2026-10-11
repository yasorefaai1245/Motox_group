<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class MotorcycleCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // Model sources:
        // https://www.honda.qa/en/motors/motorcycles/africa-twin-standard/
        // https://www.royalenfield.com/qa/en/motorcycles/classic-350/
        // https://www.royalenfield.com/qa/en/motorcycles/hunter-350/
        // https://www.royalenfield.com/qa/en/motorcycles/meteor/
        // https://www.royalenfield.com/qa/en/motorcycles/shotgun-650/
        // https://www.yamaha-motor.eu/gb/en/motorcycles/hyper-naked/pdp/mt-07/
        // https://www.bmwmotorcycles.com/en/models/adventure/r1300gs.html
        // https://www.triumphmotorcycles.com/motorcycles/classic/bonneville-t100
        // https://www.ktm.com/en-int/models/naked-bike/2026-ktm-390-duke.html
        // https://www.ktm.com/en-int/models/naked-bike/2026-ktm-990-duke.html
        // Brand marks are from manufacturer sites, except Honda (Wikimedia Commons)
        // and BMW (Simple Icons).
        // https://commons.wikimedia.org/wiki/File:Honda_Logo.svg
        // https://www.royalenfield.com/content/dam/royal-enfield/india/logos/logo.svg
        // https://www.yamaha-motor.eu/etc.clientlibs/yme/clientlibs/clientlib-react/resources/apple-touch-icon.png
        // https://cdn.simpleicons.org/bmw
        // https://media.triumphmotorcycles.co.uk/image/upload/f_auto/q_auto:eco/sitecoremedialibrary/media-library/misc/misc-images/logo.svg
        // https://www.ktm.com/content/dam/websites/ktm-com/language-masters/en/logo/37860_KTM_LogoPodium_orange_RGB.jpg
        $catalog = [
            [
                'brand' => [
                    'name' => 'Honda',
                    'slug' => 'honda',
                    'image' => '/images/brands/honda.svg',
                ],
                'models' => [
                    [
                        'name' => 'Africa Twin Standard',
                        'category' => 'Adventure',
                        'description' => 'Adventure motorcycle listed on Honda Qatar. Qatar retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/honda-africa-twin.jpg',
                    ],
                ],
            ],
            [
                'brand' => [
                    'name' => 'Royal Enfield',
                    'slug' => 'royal-enfield',
                    'image' => '/images/brands/royal-enfield.svg',
                ],
                'models' => [
                    [
                        'name' => 'Classic 350',
                        'category' => 'Roadster',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/royal-enfield-classic-350.jpg',
                    ],
                    [
                        'name' => 'Hunter 350',
                        'category' => 'Roadster',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/royal-enfield-hunter-350.jpg',
                    ],
                    [
                        'name' => 'Meteor 350',
                        'category' => 'Cruiser',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/royal-enfield-meteor-350.jpg',
                    ],
                    [
                        'name' => 'Shotgun 650',
                        'category' => 'Roadster',
                        'description' => 'Model shown on the Royal Enfield Qatar site. Qatar retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/royal-enfield-shotgun-650.jpg',
                    ],
                ],
            ],
            [
                'brand' => [
                    'name' => 'Yamaha',
                    'slug' => 'yamaha',
                    'image' => '/images/brands/yamaha.png',
                ],
                'models' => [
                    [
                        'name' => 'MT-07',
                        'category' => 'Roadster',
                        'description' => 'Model listed by Yamaha Motor Europe. Local retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/yamaha-mt-07.jpg',
                    ],
                ],
            ],
            [
                'brand' => [
                    'name' => 'BMW Motorrad',
                    'slug' => 'bmw-motorrad',
                    'image' => '/images/brands/bmw.svg',
                ],
                'models' => [
                    [
                        'name' => 'R 1300 GS',
                        'category' => 'Adventure',
                        'description' => 'Model listed by BMW Motorrad. Local retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/bmw-r-1300-gs.jpg',
                    ],
                ],
            ],
            [
                'brand' => [
                    'name' => 'Triumph',
                    'slug' => 'triumph',
                    'image' => '/images/brands/triumph.svg',
                ],
                'models' => [
                    [
                        'name' => 'Bonneville T100',
                        'category' => 'Classic',
                        'description' => 'Model listed by Triumph Motorcycles. Local retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/triumph-bonneville-t100.jpg',
                    ],
                ],
            ],
            [
                'brand' => [
                    'name' => 'KTM',
                    'slug' => 'ktm',
                    'image' => '/images/brands/ktm.jpg',
                ],
                'models' => [
                    [
                        'name' => '390 Duke',
                        'category' => 'Roadster',
                        'description' => 'Model listed by KTM. Local retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/ktm-390-duke.jpg',
                    ],
                    [
                        'name' => '990 Duke',
                        'category' => 'Roadster',
                        'description' => 'Model listed by KTM. Local retail price and current dealer stock have not been verified.',
                        'image' => '/images/motorcycles/ktm-990-duke.jpg',
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
                    'image' => $entry['brand']['image'],
                    'status' => 'active',
                ]
            );

            if (!$brand->image) {
                $brand->image = $entry['brand']['image'];
                $brand->save();
            }

            foreach ($entry['models'] as $model) {
                $motorcycle = $brand->motorcycles()->firstOrCreate(
                    ['name' => $model['name']],
                    [
                        'category' => $model['category'],
                        'description' => $model['description'],
                        'price' => null,
                        'image' => $model['image'],
                        'status' => 'active',
                    ]
                );

                if (!$motorcycle->image) {
                    $motorcycle->image = $model['image'];
                    $motorcycle->save();
                }
            }
        }
    }
}
