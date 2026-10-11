<?php

namespace App\Http\Requests;


use App\Models\Motorcycle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MotorcycleRequest extends FormRequest
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

        $motorcycle = $this->route('motorcycle');

        if ($motorcycle && !$motorcycle instanceof Motorcycle) {
            $motorcycle = Motorcycle::find($motorcycle);
        }

        if (
            $motorcycle &&
            !$user->brands()
                ->where('brands.id', $motorcycle->brand_id)
                ->exists()
        ) {
            return false;
        }

        $brandId = $this->input(
            'brand_id',
            $motorcycle?->brand_id
        );

        return $brandId !== null
            && $user->brands()
                ->where('brands.id', $brandId)
                ->exists();
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT')
            || $this->isMethod('PATCH');

        $required = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        return [
            'brand_id' => [
                ...$required,
                'integer',
                'exists:brands,id',
            ],
            'name' => [
                ...$required,
                'string',
                'max:255',
            ],
            'category' => [
                ...$required,
                'string',
                'max:100',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
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
