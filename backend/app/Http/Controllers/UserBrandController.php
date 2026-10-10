<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserBrandController extends Controller
{
    public function index(User $user)
    {
        abort_unless(auth()->user()->isAdmin(), 403);
        abort_unless($user->isDataEntry(), 404);

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'role'),
            'brands' => $user->brands()->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless(auth()->user()->isAdmin(), 403);
        abort_unless($user->isDataEntry(), 404);

        $data = $request->validate([
            'brand_ids' => ['required', 'array'],
            'brand_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:brands,id',
            ],
        ]);

        $user->brands()->sync($data['brand_ids']);

        return response()->json([
            'message' => 'User brands updated successfully.',
            'brands' => $user->brands()->get(),
        ]);
    }
}
