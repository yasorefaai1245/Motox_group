<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Motorcycle;
use App\Models\Service;
use App\Models\Showroom;

class PublicCatalogController extends Controller
{
    public function brands()
    {
        return response()->json(
            Brand::where('status', 'active')
                ->select('id', 'name', 'slug', 'description', 'image')
                ->orderBy('name')
                ->get()
        );
    }

    public function motorcycles()
    {
        return response()->json(
            Motorcycle::where('status', 'active')
                ->whereHas('brand', function ($query) {
                    $query->where('status', 'active');
                })
                ->with('brand:id,name,slug')
                ->orderBy('name')
                ->paginate(12)
        );
    }

    public function motorcycle(Motorcycle $motorcycle)
    {
        abort_unless(
            $motorcycle->status === 'active'
            && $motorcycle->brand?->status === 'active',
            404
        );

        return response()->json($motorcycle->load('brand'));
    }

    public function services()
    {
        return response()->json(
            Service::where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('brand_id')
                        ->orWhereHas('brand', function ($brandQuery) {
                            $brandQuery->where('status', 'active');
                        });
                })
                ->with('brand:id,name,slug')
                ->orderBy('name')
                ->get()
        );
    }

    public function showrooms()
    {
        return response()->json(
            Showroom::where('status', 'active')
                ->with([
                    'brands' => function ($query) {
                        $query->where('brands.status', 'active');
                    },
                ])
                ->orderBy('city')
                ->get()
        );
    }
}
