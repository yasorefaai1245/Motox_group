<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceRequest;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    private function visibleServices(Request $request)
    {
        $query = Service::query()->with('brand');

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
            $this->visibleServices($request)->latest()->paginate(12)
        );
    }

    public function store(ServiceRequest $request)
    {
        $service = Service::create($request->validated());

        return response()->json($service->load('brand'), 201);
    }

    public function show(Request $request, Service $service)
    {
        abort_unless(
            $request->user()->isAdmin()
            || (
                $service->brand_id !== null
                && $request->user()->brands()
                    ->where('brands.id', $service->brand_id)->exists()
            ),
            403
        );

        return response()->json($service->load('brand'));
    }

    public function update(ServiceRequest $request, Service $service)
    {
        $service->update($request->validated());

        return response()->json($service->fresh()->load('brand'));
    }

    public function destroy(Request $request, Service $service)
    {
        abort_unless(
            $request->user()->isAdmin()
            || (
                $service->brand_id !== null
                && $request->user()->brands()
                    ->where('brands.id', $service->brand_id)->exists()
            ),
            403
        );

        $service->delete();

        return response()->json([
            'message' => 'Service deleted successfully.',
        ]);
    }
}
