<?php

namespace App\Http\Controllers;

use App\Http\Requests\TestRideRequest;
use App\Models\Motorcycle;
use App\Models\Showroom;
use App\Models\TestRide;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TestRideController extends Controller
{
    private function visibleTestRides(Request $request)
    {
        $query = TestRide::query()
            ->with(['motorcycle.brand', 'showroom']);

        if (!$request->user()->isAdmin()) {
            $query->whereHas('motorcycle', function ($motorcycles) use ($request) {
                $motorcycles->whereIn(
                    'brand_id',
                    $request->user()->brands()->select('brands.id')
                );
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->visibleTestRides($request)->latest()->paginate(12)
        );
    }

    public function store(TestRideRequest $request)
    {
        $data = $request->validated();

        $motorcycle = Motorcycle::findOrFail($data['motorcycle_id']);
        $showroom = Showroom::findOrFail($data['showroom_id']);

        abort_unless(
            $motorcycle->status === 'active'
            && $motorcycle->brand?->status === 'active'
            && $showroom->status === 'active',
            422,
            'The motorcycle, brand, or showroom is unavailable.'
        );

        abort_unless(
            $showroom->brands()
                ->where('brands.id', $motorcycle->brand_id)
                ->exists(),
            422,
            'The showroom is not associated with this motorcycle brand.'
        );

        $data['status'] = 'pending';

        $testRide = TestRide::create($data);

        return response()->json(
            $testRide->load(['motorcycle.brand', 'showroom']),
            201
        );
    }

    public function show(Request $request, TestRide $testRide)
    {
        abort_unless(
            $this->visibleTestRides($request)
                ->whereKey($testRide->id)->exists(),
            403
        );

        return response()->json(
            $testRide->load(['motorcycle.brand', 'showroom'])
        );
    }

    public function update(Request $request, TestRide $testRide)
    {
        abort_unless(
            $this->visibleTestRides($request)
                ->whereKey($testRide->id)->exists(),
            403
        );

        $data = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    'pending',
                    'confirmed',
                    'completed',
                    'cancelled',
                ]),
            ],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $testRide->update($data);

        return response()->json($testRide->fresh());
    }

    public function destroy(Request $request, TestRide $testRide)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $testRide->delete();

        return response()->json([
            'message' => 'Test ride deleted successfully.',
        ]);
    }
}
