<?php

namespace App\Http\Controllers;

use App\Http\Requests\ShowroomRequest;
use App\Models\Showroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShowroomController extends Controller
{
    public function index()
    {
        return response()->json(
            Showroom::with('brands')->latest()->paginate(12)
        );
    }

    public function store(ShowroomRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $brandIds = $data['brand_ids'];
            unset($data['brand_ids']);

            $showroom = Showroom::create($data);
            $showroom->brands()->sync($brandIds);

            return response()->json(
                $showroom->load('brands'),
                201
            );
        });
    }

    public function show(Showroom $showroom)
    {
        return response()->json($showroom->load('brands'));
    }

    public function update(
        ShowroomRequest $request,
        Showroom $showroom
    ) {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $showroom) {
            if (array_key_exists('brand_ids', $data)) {
                $showroom->brands()->sync($data['brand_ids']);
                unset($data['brand_ids']);
            }

            $showroom->update($data);

            return response()->json(
                $showroom->fresh()->load('brands')
            );
        });
    }

    public function destroy(Showroom $showroom)
    {
        $showroom->delete();

        return response()->json([
            'message' => 'Showroom deleted successfully.',
        ]);
    }
}
