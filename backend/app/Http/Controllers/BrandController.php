<?php

namespace App\Http\Controllers;

use App\Http\Requests\BrandRequest;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    private function visibleBrands(Request $request)
    {
        $user = $request->user();

        return $user->isAdmin()
            ? Brand::query()
            : $user->brands();
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->visibleBrands($request)->latest()->paginate(12)
        );
    }

    public function store(BrandRequest $request)
    {
        $brand = Brand::create($request->validated());

        return response()->json($brand, 201);
    }

    public function show(Request $request, Brand $brand)
    {
        abort_unless(
            $request->user()->isAdmin()
            || $request->user()->brands()
                ->where('brands.id', $brand->id)->exists(),
            403
        );

        return response()->json($brand);
    }

    public function update(BrandRequest $request, Brand $brand)
    {
        $brand->update($request->validated());

        return response()->json($brand->fresh());
    }

    public function destroy(Request $request, Brand $brand)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $brand->delete();

        return response()->json([
            'message' => 'Brand deleted successfully.',
        ]);
    }
}
