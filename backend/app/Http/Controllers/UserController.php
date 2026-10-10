<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::where('role', 'data_entry')
                ->with('brands:id,name,slug')
                ->orderBy('name')
                ->paginate(12)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'brand_ids' => ['required', 'array', 'min:1'],
            'brand_ids.*' => ['required', 'integer', 'distinct', 'exists:brands,id'],
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'data_entry',
            ]);
            $user->brands()->sync($data['brand_ids']);

            return response()->json(
                $user->load('brands:id,name,slug'),
                201
            );
        });
    }

    public function show(User $user)
    {
        abort_unless($user->isDataEntry(), 404);

        return response()->json(
            $user->load('brands:id,name,slug')
                ->makeHidden(['password', 'remember_token'])
        );
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->isDataEntry(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'brand_ids' => ['required', 'array', 'min:1'],
            'brand_ids.*' => ['required', 'integer', 'distinct', 'exists:brands,id'],
        ]);

        DB::transaction(function () use ($data, $user) {
            $user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);
            $user->brands()->sync($data['brand_ids']);
        });

        return response()->json(
            $user->fresh()->load('brands:id,name,slug')
        );
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($user->isDataEntry(), 404);
        abort_if($request->user()->is($user), 403, 'You cannot delete your own account.');

        DB::transaction(function () use ($user) {
            if (DB::getSchemaBuilder()->hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            $user->brands()->detach();
            $user->delete();
        });

        return response()->json([
            'message' => 'Data Entry account deleted successfully.',
        ]);
    }
}
