<?php

namespace App\Http\Controllers;

use App\Http\Requests\EnquiryRequest;
use App\Models\Enquiry;
use Illuminate\Http\Request;

class EnquiryController extends Controller
{
    private function visibleEnquiries(Request $request)
    {
        $query = Enquiry::query()->with('motorcycle.brand');

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
            $this->visibleEnquiries($request)->latest()->paginate(12)
        );
    }

    public function store(EnquiryRequest $request)
    {
        $data = $request->validated();

        if (!empty($data['motorcycle_id'])) {
            $motorcycle = \App\Models\Motorcycle::findOrFail(
                $data['motorcycle_id']
            );

            abort_unless($motorcycle->status === 'active', 422, 'This motorcycle is unavailable.');
        }

        $data['status'] = 'pending';

        $enquiry = Enquiry::create($data);

        return response()->json($enquiry, 201);
    }

    public function show(Request $request, Enquiry $enquiry)
    {
        $visible = $this->visibleEnquiries($request)
            ->whereKey($enquiry->id)
            ->exists();

        abort_unless($visible, 403);

        return response()->json($enquiry->load('motorcycle.brand'));
    }

    public function update(Request $request, Enquiry $enquiry)
    {
        abort_unless(
            $this->visibleEnquiries($request)
                ->whereKey($enquiry->id)->exists(),
            403
        );

        $data = $request->validate([
            'status' => [
                'required',
                \Illuminate\Validation\Rule::in([
                    'pending',
                    'in_progress',
                    'resolved',
                    'closed',
                ]),
            ],
        ]);

        $enquiry->update($data);

        return response()->json($enquiry->fresh());
    }

    public function destroy(Request $request, Enquiry $enquiry)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $enquiry->delete();

        return response()->json([
            'message' => 'Enquiry deleted successfully.',
        ]);
    }
}
