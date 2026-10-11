<?php

namespace App\Http\Requests;

use App\Models\Brand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->isDataEntry()) {
            return false;
        }

        $brand = $this->route('brand');

        if (!$brand) {
            return false;
        }

        $brandId = $brand instanceof Brand
            ? $brand->id
            : $brand;

        return $user->brands()
            ->where('brands.id', $brandId)
            ->exists();
    }

    public function rules(): array
    {
        $brand = $this->route('brand');

        $brandId = $brand instanceof Brand
            ? $brand->id
            : $brand;

        $isUpdate = $this->isMethod('PUT')
            || $this->isMethod('PATCH');

        $required = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        return [
            'name' => [
                ...$required,
                'string',
                'max:255',
            ],
            'slug' => [
                ...$required,
                'string',
                'max:255',
                Rule::unique('brands', 'slug')->ignore($brandId),
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'image' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000000',
            ],
            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }
}
