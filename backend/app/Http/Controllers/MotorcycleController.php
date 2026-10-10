<?php

namespace App\Http\Controllers;

use App\Http\Requests\MotorcycleRequest;
use App\Models\Motorcycle;
use Illuminate\Http\Request;

class MotorcycleController extends Controller
{
    private function visibleMotorcycles(Request $request)
    {
        $query = Motorcycle::query()->with('brand');

        if (!$request->user()->isAdmin()) {
            $query->whereIn(
                'brand_id',
                $request->user()->brands()->select('brands.id')
            );
        }

        return $query;
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->visibleMotorcycles($request)->latest()->paginate(12)
        );
    }

    public function store(MotorcycleRequest $request)
    {
        $motorcycle = Motorcycle::create($request->validated());

        return response()->json($motorcycle->load('brand'), 201);
    }

    public function show(Request $request, Motorcycle $motorcycle)
    {
        abort_unless(
            $request->user()->isAdmin()
            || $request->user()->brands()
                ->where('brands.id', $motorcycle->brand_id)->exists(),
            403
        );

        return response()->json($motorcycle->load('brand'));
    }

    public function update(
        MotorcycleRequest $request,
        Motorcycle $motorcycle
    ) {
        $motorcycle->update($request->validated());

        return response()->json($motorcycle->fresh()->load('brand'));
    }

    public function destroy(Request $request, Motorcycle $motorcycle)
    {
        abort_unless(
            $request->user()->isAdmin()
            || $request->user()->brands()
                ->where('brands.id', $motorcycle->brand_id)->exists(),
            403
        );

        $motorcycle->delete();

        return response()->json([
            'message' => 'Motorcycle deleted successfully.',
        ]);
    }
}
